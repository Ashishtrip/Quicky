# Quicky Store Assignment Architecture

This architecture adapts the Uber Rider-Driver matching workflow for Quicky's User-Store model. It ensures real-time notifications, geo-hash based store discovery, and reliable assignment using distributed locks.

## User Review Required

Please review the proposed architecture diagram and the step-by-step flow below.

> [!IMPORTANT]
The design strictly replicates the Uber model provided in your description and image, substituting Riders for Users and Drivers for Stores. Let me know if this accurately reflects your intent before we proceed to any implementation steps.
> 

## Open Questions

1. **Message Broker Topics**: You mentioned the store subscribing to topics like "chips to jims rohini sector -5". Are these topics dynamically created per cart/item, or are they static regional topics (e.g., `orders.rohini-sector-5`) that stores subscribe to based on their location?
2. **Acceptance Flow**: When a store accepts an item, the database is updated to `accepted`. Should the system immediately release the distributed lock for this item, and how do we handle timeouts if a store doesn't respond within a specific timeframe?
3. **Geo-hashing**: Do you have a preferred technology for the Store Location Cache (e.g., Redis Geospatial indexes, PostGIS)?

## Proposed Architecture Diagram

```mermaid
graph LR
    classDef default fill:#1f2937,stroke:#374151,stroke-width:2px,color:#f9fafb;
    classDef client fill:#374151,stroke:#4b5563,color:#f9fafb;
    classDef gateway fill:#0d9488,stroke:#0f766e,color:#f9fafb;
    classDef websocket fill:#be185d,stroke:#9d174d,color:#f9fafb;
    classDef service fill:#15803d,stroke:#166534,color:#f9fafb;
    classDef queue fill:#0369a1,stroke:#075985,color:#f9fafb;
    classDef db fill:#1d4ed8,stroke:#1e40af,color:#f9fafb;
    classDef lock fill:#b91c1c,stroke:#991b1b,color:#f9fafb;

    User[📱 User]:::client
    Store[📱 Store]:::client

    Gateway((API Gateway)):::gateway

    User --> Gateway
    Store --> Gateway

    UserWS[User Websocket Server]:::websocket
    CartService[Cart / Order Service]:::service
    StoreWS[Store Websocket Server]:::websocket

    Gateway --> UserWS
    Gateway --> CartService
    Gateway --> StoreWS

    Broker[(Message Broker)]:::queue
    UserWS <--> Broker

    ThirdParty[Third Party Mapping Service]:::db
    DB[(Database)]:::db

    Broker --> ThirdParty
    Broker --> DB
    Broker --> CartService

    AssignQueue([Store Assignment Queue]):::queue
    CartService --> AssignQueue

    AssignService[Store Assignment Service]:::service
    AssignQueue --> AssignService

    LocQueue([Store Location Queue]):::queue
    LocService[Store Location Service]:::service
    LocCache[(Store Location Cache)]:::db

    StoreWS --> LocQueue
    LocQueue --> LocService
    LocService --> LocCache

    AssignService -->|Queries using Geo-hashing| LocCache

    DistLock[Distributed Lock]:::lock
    AssignService --> DistLock

    NotifService[Notification Service]:::service
    AssignService --> NotifService
    NotifService -->|Notifies| Store
```

## Step-by-Step Data Flow

1. **Connection & Subscription**:
    - Users and Stores open the Quicky app, establishing connections via the **API Gateway**.
    - The Store connects to the **Store Websocket Server** and subscribes to location-specific topics (e.g., `rohini-sector-5`) in the **Message Broker** for personalized, real-time notifications.
2. **Item Selection & Cart Creation**:
    - The User selects an item. This request is routed to the **Cart / Order Service**.
    - A cart entry is created in the **Database** with the status `created`.
3. **Queueing the Assignment**:
    - The new item is placed onto the **Store Assignment Queue** for async processing.
4. **Store Discovery (Geo-hashing)**:
    - The **Store Assignment Service** pulls the item from the queue.
    - It queries the **Store Location Cache** (populated continuously via the Store Location Service) using geo-hashing to find nearby available stores.
5. **Locking & Notification**:
    - The Assignment Service uses a **Distributed Lock** to ensure the order is only offered to one store at a time.
    - It sends a notification to the selected store via the **Notification Service**.
6. **Acceptance & Routing**:
    - If the Store accepts, the Cart/Order Service updates the **Database** status to `accepted`.
    - A success message is sent back to the User via their websocket connection.
    - **Third Party Mapping Services** are utilized to generate the optimal route between the Store and the User location for delivery.