import { useEffect, useRef } from 'react';

/**
 * PriceChart Component - Displays price history as a line chart
 * Automatically extends the chart to current date if last entry is old
 */
export default function PriceChart({ priceHistory, width = 600, height = 300 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !priceHistory || priceHistory.length === 0) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Chart configuration
        const padding = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Extend price history to current date if needed
        const extendedHistory = [...priceHistory];
        const lastEntry = priceHistory[priceHistory.length - 1];
        const lastDate = new Date(lastEntry.updated_at);
        const currentDate = new Date();
        
        // If last entry is not today, add current date with same price
        const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 0) {
            extendedHistory.push({
                price: lastEntry.price,
                updated_at: currentDate.toISOString()
            });
        }

        // Extract data
        const prices = extendedHistory.map(item => item.price);
        const dates = extendedHistory.map(item => new Date(item.updated_at));
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // Helper functions
        const getX = (index) => {
            return padding.left + (index / (prices.length - 1 || 1)) * chartWidth;
        };

        const getY = (price) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines (5 lines)
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
            
            // Price labels
            const price = maxPrice - (i / 5) * priceRange;
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`Rs. ${Math.round(price)}`, padding.left - 10, y + 4);
        }

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();

        // Draw line chart
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        prices.forEach((price, index) => {
            const x = getX(index);
            const y = getY(price);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw gradient fill under line
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        prices.forEach((price, index) => {
            const x = getX(index);
            const y = getY(price);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(getX(prices.length - 1), padding.top + chartHeight);
        ctx.lineTo(getX(0), padding.top + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Draw data points
        prices.forEach((price, index) => {
            const x = getX(index);
            const y = getY(price);
            
            // Outer circle
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw date labels (show max 6 labels)
        const labelInterval = Math.max(1, Math.floor(dates.length / 6));
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        
        dates.forEach((date, index) => {
            if (index % labelInterval === 0 || index === dates.length - 1) {
                const x = getX(index);
                const y = padding.top + chartHeight + 20;
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                ctx.fillText(dateStr, x, y);
            }
        });

        // Draw title
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Price History', width / 2, 25);

    }, [priceHistory, width, height]);

    if (!priceHistory || priceHistory.length === 0) {
        return (
            <div style={{
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '14px'
            }}>
                No price history available
            </div>
        );
    }

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                maxWidth: '100%', 
                height: 'auto',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
            }}
        />
    );
}
