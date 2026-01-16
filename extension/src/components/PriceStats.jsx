import { formatPrice } from '../lib/utils';

/**
 * PriceStats - Minimal price display
 */
export default function PriceStats({ stats }) {
    if (!stats) return null;

    return (
        <div style={styles.container}>
            <div style={styles.priceItem}>
                <span style={styles.label}>Lowest</span>
                <span style={{...styles.value, color: '#10b981'}}>{formatPrice(stats.lowest)}</span>
            </div>
            <div style={styles.priceItem}>
                <span style={styles.label}>Highest</span>
                <span style={{...styles.value, color: '#ef4444'}}>{formatPrice(stats.highest)}</span>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        gap: '24px',
        marginBottom: '16px',
        padding: '8px 0',
    },
    priceItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    label: {
        fontSize: '11px',
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    value: {
        fontSize: '20px',
        fontWeight: 'bold',
    },
};
