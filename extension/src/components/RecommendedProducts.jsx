import { formatPrice } from '../lib/utils';
import { useRef, useState } from 'react';

/**
 * RecommendedProducts - Shows similar cheaper products in a horizontal scroll
 */
export default function RecommendedProducts({ recommendations, loading }) {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    if (loading) {
        return null;
    }

    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
        scrollRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Similar Products (Lower Price)</h3>
            
            <div 
                ref={scrollRef}
                style={styles.productsRow}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {recommendations.map((product, index) => (
                    <a
                        key={index}
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.card}
                        onDragStart={(e) => e.preventDefault()} // Prevent image drag
                    >
                        {product.image && (
                            <div style={styles.imageContainer}>
                                <img 
                                    src={product.image} 
                                    alt={product.product_name}
                                    style={styles.image}
                                    draggable="false"
                                />
                            </div>
                        )}
                        <div style={styles.details}>
                            <div style={styles.productName}>{product.product_name}</div>
                            <div style={styles.priceTag}>{formatPrice(product.price)}</div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        marginTop: '16px',
        padding: '16px',
        background: '#fff',
        borderRadius: '8px',
    },
    title: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
    },
    productsRow: {
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '8px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f9fafb',
        cursor: 'grab',
        userSelect: 'none',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: '180px',
        maxWidth: '180px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'box-shadow 0.2s, transform 0.2s',
        background: '#fff',
        flexShrink: 0,
    },
    imageContainer: {
        width: '100%',
        height: '180px',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none', // Prevent image drag interference
    },
    details: {
        padding: '12px',
    },
    productName: {
        fontSize: '13px',
        color: '#4b5563',
        lineHeight: '1.4',
        marginBottom: '8px',
        display: '-webkit-box',
        WebkitLineClamp: '2',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        minHeight: '36px',
    },
    priceTag: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#10b981',
    },
};
