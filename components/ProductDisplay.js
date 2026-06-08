// components/ProductDisplay.js
import { useState, useEffect } from 'react';

export default function ProductDisplay({ productUrl }) {
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Llamamos a nuestra propia API creada arriba
        fetch(`/api/extract-product?url=${encodeURIComponent(productUrl)}`)
            .then(res => {
                if (!res.ok) throw new Error("Error al consultar la API");
                return res.json();
            })
            .then(data => setProduct(data))
            .catch(err => setError(err.message));
    }, [productUrl]);

    if (error) return <p>Error: {error}</p>;
    if (!product) return <p>Cargando datos del producto desde Empire Keeway...</p>;

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc' }}>
            <h1>{product.name}</h1>
            <p><strong>SKU:</strong> {product.sku}</p>
            <p><strong>Precio:</strong> ${product.price}</p>

            {/* Carga la imagen directamente del servidor de origen */}
            <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', maxWidth: '500px', height: 'auto' }}
            />
        </div>
    );
}