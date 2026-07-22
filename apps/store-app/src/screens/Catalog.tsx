import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCatalog, useStoreListings, useDeleteListing } from '../hooks/useTagging';
import { useNotificationStore } from '../stores/notificationStore';
import { RootStackParamList } from '../index';

const COLORS = {
  background: '#f6fafa',
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainer: '#eaefee',
  surfaceContainerHigh: '#e4e9e9',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  secondary: '#516607',
  secondaryContainer: '#d3ed84',
  tertiary: '#8b4b55',
  error: '#ba1a1a',
  outlineVariant: '#bdc9c9',
};

import { MaterialIcons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export const CatalogScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'catalog'>('inventory');
  
  const { data: catalog, isLoading: isCatalogLoading, error: catalogError } = useCatalog();
  const { data: listings, isLoading: isListingsLoading, error: listingsError } = useStoreListings();
  const { mutate: deleteListing } = useDeleteListing();
  
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);

  const isLoading = isCatalogLoading || isListingsLoading;
  const error = catalogError || listingsError;

  if (isLoading) return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Error loading data.</Text></View>;

  const filteredCatalog = catalog?.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredListings = listings?.filter((listing: any) => 
    listing.catalogItem?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const displayData = activeTab === 'inventory' ? filteredListings : filteredCatalog;
  const isCatalogTab = activeTab === 'catalog';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('Dashboard' as any)}>
          <MaterialIcons name="storefront" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.title}>Quicky</Text>
        <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications' as any)}>
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]} 
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>My Inventory</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'catalog' && styles.activeTab]} 
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.activeTabText]}>All Products</Text>
        </Pressable>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'inventory' ? "Search my inventory..." : "Search all products..."}
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={displayData}
        keyExtractor={(item: any) => activeTab === 'inventory' ? item.id : item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'inventory' 
                ? "You haven't listed any items yet." 
                : "No products found."}
            </Text>
            {activeTab === 'inventory' && (
              <Pressable style={styles.emptyButton} onPress={() => setActiveTab('catalog')}>
                <Text style={styles.emptyButtonText}>Browse Catalog</Text>
              </Pressable>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          if (activeTab === 'inventory') {
            // Render Listing Item
            const catalogItem = item.catalogItem;
            if (!catalogItem) return null;
            
            const isWarning = item.expiryBucket === 'USE_TODAY';

            return (
              <Pressable 
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('Tagging', { 
                  catalogItemId: catalogItem.id,
                  name: catalogItem.name,
                  price: catalogItem.referenceMrp || 0,
                  isCustom: catalogItem.isCustom,
                  unit: catalogItem.unit,
                  imageUrl: catalogItem.imageUrl,
                  listingId: item.id
                })}
              >
                <View style={styles.cardImagePlaceholder}>
                  {catalogItem.imageUrl ? (
                    <Image source={{ uri: catalogItem.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <Text style={styles.cardImageIcon}>📦</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{catalogItem.name}</Text>
                      <Text style={styles.unitText}>{catalogItem.unit} · ₹{item.price}</Text>
                    </View>
                    <Pressable 
                      style={{ padding: 4 }}
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          "Delete Item",
                          "Are you sure you want to remove this item from your inventory?",
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => deleteListing(item.id) }
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                    </Pressable>
                  </View>
                  <View style={styles.cardFooter}>
                    {isWarning ? (
                      <View style={styles.statusBadgeWarning}>
                        <Text style={styles.statusBadgeTextWarning}>⚠️ Use Today</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadgeSuccess}>
                        <Text style={styles.statusBadgeTextSuccess}>Fresh Stock</Text>
                      </View>
                    )}
                    <Text style={[styles.stockText, isWarning && styles.stockTextWarning]}>
                      Stock: {item.stockQuantity}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          } else {
            // Render Catalog Item
            return (
              <Pressable 
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('Tagging', { 
                  catalogItemId: item.id,
                  name: item.name,
                  price: item.referenceMrp || 0,
                  isCustom: item.isCustom,
                  unit: item.unit,
                  imageUrl: item.imageUrl
                })}
              >
                <View style={styles.cardImagePlaceholder}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <Text style={styles.cardImageIcon}>📦</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <View>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.unitText}>{item.unit} · ₹{item.referenceMrp || 49}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.addToInventoryText}>+ Tap to list item</Text>
                  </View>
                </View>
              </Pressable>
            );
          }
        }}
      />

      {isCatalogTab ? (
        <Pressable 
          style={styles.fab}
          onPress={() => navigation.navigate('AddCustomProduct')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  headerIconText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 201, 0.3)',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    height: '100%',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.08,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardImageIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
    height: 80,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  unitText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToInventoryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(81, 102, 7, 0.1)',
    borderColor: 'rgba(81, 102, 7, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextSuccess: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(139, 75, 85, 0.1)',
    borderColor: 'rgba(139, 75, 85, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextWarning: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  stockTextWarning: {
    color: COLORS.error,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 16,
    bottom: 88, // Above bottom nav
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    fontSize: 28,
    color: COLORS.onPrimaryContainer,
  }
});

