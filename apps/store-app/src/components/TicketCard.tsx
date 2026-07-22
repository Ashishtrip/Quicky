import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { OrderTicket } from '@quicky/api-client';

const COLORS = {
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#dfe3e3',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceContainerHigh: '#e4e9e9',
  surfaceContainer: '#eaefee',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  outlineVariant: '#bdc9c9',
  error: '#ba1a1a',
  secondary: '#516607',
  primary: '#00696c',
  onPrimary: '#ffffff',
};

interface TicketCardProps {
  ticket: OrderTicket;
  isPending: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onPack?: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isPacking?: boolean;
}

export const TicketCard = ({
  ticket,
  isPending,
  onAccept,
  onDecline,
  onPack,
  isAccepting,
  isDeclining,
  isPacking,
}: TicketCardProps) => {
  const [packedItems, setPackedItems] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isPending || !ticket.expiresAt) return;

    const calculateTimeLeft = () => {
      const expires = new Date(ticket.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && onDecline) {
        onDecline(ticket.id);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [isPending, ticket.expiresAt, onDecline, ticket.id]);

  const toggleItemPacked = (itemId: string) => {
    if (packedItems.includes(itemId)) {
      setPackedItems(packedItems.filter((id) => id !== itemId));
    } else {
      setPackedItems([...packedItems, itemId]);
    }
  };

  const allItemsPacked = ticket.order.items.length === packedItems.length;
  const isAwaitingPayment = ticket.order.status === 'AWAITING_PAYMENT';

  const totalItems = ticket.order.items.reduce((acc, item) => acc + item.quantity, 0);

  const renderedItems = ticket.order.items.map((item) => {
    const isPacked = packedItems.includes(item.id);
    const isUseToday = item.expiryBucket === 'USE_TODAY';

    return (
      <Pressable
        key={item.id}
        style={[
          styles.itemRow,
          !isPending && styles.interactiveItemRow,
        ]}
        onPress={() => {
          if (!isPending) toggleItemPacked(item.id);
        }}
        disabled={isPending}
      >
        <View style={styles.itemMeta}>
          <Text style={[styles.itemName, !isPending && isPacked && styles.textPacked]}>
            {item.catalogItem?.name || 'Unknown Item'}
          </Text>
          <View style={[styles.bucketBadge, isUseToday ? styles.bucketUseToday : styles.bucketFreshStock]}>
            <Text style={[styles.bucketText, isUseToday ? styles.bucketTextUseToday : styles.bucketTextFreshStock]}>
              {isUseToday ? 'Yellow Tag (Use Today)' : 'Green Tag (Fresh Stock)'}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemQuantityBadge}>x{item.quantity}</Text>
          {!isPending && (
            <View style={[styles.checkbox, isPacked && styles.checkboxChecked]}>
              {isPacked && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
          )}
        </View>
      </Pressable>
    );
  });

  return (
    <View style={[styles.ticketCard, isAwaitingPayment && styles.ticketCardAwaiting]}>
      {/* Header */}
      <View style={styles.ticketHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.idRow}>
            <Text style={styles.orderId}>#{ticket.orderId.slice(-6).toUpperCase()}</Text>
            {isPending && (
              <View style={[styles.timeBadge, timeLeft <= 15 ? styles.timeBadgeDanger : styles.timeBadgeWarning]}>
                {timeLeft <= 15 && <View style={styles.timeBadgeDot} />}
                <Text style={[styles.timeBadgeText, timeLeft <= 15 ? styles.timeBadgeTextDanger : styles.timeBadgeTextWarning]}>
                  {timeLeft}s ago
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.customerName}>Customer: Rahul</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.totalValue}>₹{ticket.order.totalAmount}</Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountText}>{totalItems} items</Text>
          </View>
        </View>
      </View>

      {!isPending && (
        <View style={styles.itemsList}>
          {renderedItems}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {isPending ? (
          <View style={styles.pendingActions}>
            <Pressable
              style={({pressed}) => [styles.actionButton, styles.declineButton, pressed && styles.btnPressed]}
              onPress={() => onDecline?.(ticket.id)}
              disabled={isDeclining || isAccepting}
            >
              <Text style={styles.declineText}>Reject</Text>
            </Pressable>
            
            <Pressable
              style={({pressed}) => [styles.actionButton, styles.acceptButton, pressed && styles.btnPressed]}
              onPress={() => onAccept?.(ticket.id)}
              disabled={isDeclining || isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator color={COLORS.onPrimaryContainer} size="small" />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </Pressable>
          </View>
        ) : (
          !isAwaitingPayment && (
            <Pressable
              style={({pressed}) => [
                styles.packButton,
                !allItemsPacked && styles.packButtonDisabled,
                pressed && allItemsPacked && styles.btnPressed
              ]}
              onPress={() => onPack?.(ticket.id)}
              disabled={!allItemsPacked || isPacking}
            >
              {isPacking ? (
                <ActivityIndicator color={allItemsPacked ? COLORS.onPrimary : COLORS.outlineVariant} size="small" />
              ) : (
                <Text style={[styles.packText, !allItemsPacked && styles.packTextDisabled]}>
                  {allItemsPacked ? 'Mark as Ready to Ship' : `Check all items to proceed (${packedItems.length}/${ticket.order.items.length})`}
                </Text>
              )}
            </Pressable>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  ticketCardAwaiting: {
    opacity: 0.7,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  timeBadgeDanger: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
  },
  timeBadgeWarning: {
    backgroundColor: 'rgba(0, 105, 108, 0.1)', // Using primary/10 for non-danger like the design
  },
  timeBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeBadgeTextDanger: {
    color: COLORS.error,
  },
  timeBadgeTextWarning: {
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: COLORS.onSurface,
  },
  itemsCountBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  itemsList: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  interactiveItemRow: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemMeta: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  textPacked: {
    color: COLORS.primary,
  },
  bucketBadge: {
    alignSelf: 'flex-start',
  },
  bucketText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  bucketUseToday: {},
  bucketFreshStock: {},
  bucketTextUseToday: { color: COLORS.onSurfaceVariant },
  bucketTextFreshStock: { color: COLORS.onSurfaceVariant },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemQuantityBadge: {
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: COLORS.onSurface,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  checkboxTick: {
    color: COLORS.onPrimaryContainer,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    height: 48,
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  acceptButton: {
    backgroundColor: COLORS.primaryContainer,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  packButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  packButtonDisabled: {
    backgroundColor: COLORS.surfaceVariant,
  },
  packText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onPrimary,
  },
  packTextDisabled: {
    color: COLORS.outlineVariant,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
  },
});
