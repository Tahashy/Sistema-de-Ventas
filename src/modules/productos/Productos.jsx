import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { showToast } from '../../components/Toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    MoreVertical,
    Eye,
    EyeOff,
    X,
    Upload,
    Tag,
    Layers,
    Image as ImageIcon,
    Check
} from 'lucide-react';

const Productos = ({ restauranteId, isAdmin }) => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('all');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [restauranteId]);

    const cargarDatos = async () => {
        await Promise.all([cargarProductos(), cargarCategorias()]);
    };

    const cargarProductos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('productos')
                .select(`
          *,
          categorias (
            id,
            nombre
          )
        `)
                .eq('restaurante_id', restauranteId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .eq('restaurante_id', restauranteId)
                .order('nombre');

            if (error) throw error;
            setCategorias(data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    const eliminarProducto = async (id) => {
        try {
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await cargarProductos();
            showToast('Producto eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showToast('Error al eliminar producto', 'error');
        }
    };

    const toggleDisponibilidad = async (producto) => {
        try {
            const { error } = await supabase
                .from('productos')
                .update({ disponible: !producto.disponible })
                .eq('id', producto.id);

            if (error) throw error;
            await cargarProductos();
            showToast(
                producto.disponible ? 'Producto desactivado' : 'Producto activado',
                'success'
            );
        } catch (error) {
            console.error('Error actualizando disponibilidad:', error);
            showToast('Error al actualizar disponibilidad', 'error');
        }
    };

    const productosFiltrados = productos.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategoria = filtroCategoria === 'all' || p.categoria_id === filtroCategoria;
        return matchSearch && matchCategoria;
    });

    return (
        <div style={{ padding: window.innerWidth >= 640 ? '32px' : '16px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px',
                flexDirection: window.innerWidth >= 768 ? 'row' : 'column',
                alignItems: window.innerWidth >= 768 ? 'center' : 'stretch'
            }}>
                <div>
                    <h1 style={{
                        margin: '0 0 8px 0',
                        fontSize: window.innerWidth >= 640 ? '32px' : '24px',
                        fontWeight: '700',
                        color: '#1a202c'
                    }}>
                        Catálogo de Productos
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '16px',
                        color: '#718096'
                    }}>
                        Gestiona el inventario del restaurante
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    width: window.innerWidth >= 768 ? 'auto' : '100%',
                }}>

                    <button
                        onClick={() => setMostrarModalCategoria(true)}
                        style={{
                            padding: '12px 20px',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            color: '#4a5568',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#FF6B35';
                            e.currentTarget.style.color = '#FF6B35';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = '#4a5568';
                        }}
                    >
                        <Layers size={18} />
                        Categorías
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => {
                                setProductoEditando(null);
                                setMostrarModal(true);
                            }}
                            style={{
                                padding: '12px 20px',
                                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                                transition: 'all 0.2s',
                                flex: window.innerWidth >= 768 ? '0' : '1'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,107,53,0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,53,0.3)';
                            }}
                        >
                            <Plus size={18} />
                            Agregar Producto
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexDirection: window.innerWidth >= 768 ? 'row' : 'column',
            }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#a0aec0'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#FF6B35';
                            e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: window.innerWidth >= 768 ? '200px' : '100%',
                        width: window.innerWidth >= 768 ? 'auto' : '100%'
                    }}
                >
                    <option value="all">Todas las categorías</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Grid de Productos */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
                    Cargando productos...
                </div>
            ) : productosFiltrados.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    background: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #e2e8f0'
                }}>
                    <Package size={48} color="#cbd5e0" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#718096', fontSize: '16px', margin: 0 }}>
                        {searchTerm || filtroCategoria !== 'all'
                            ? 'No se encontraron productos'
                            : 'No hay productos registrados'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth >= 640 ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
                    gap: '24px'
                }}>
                    {productosFiltrados.map(producto => (
                        <ProductoCard
                            key={producto.id}
                            producto={producto}
                            isAdmin={isAdmin}
                            onEditar={() => {
                                setProductoEditando(producto);
                                setMostrarModal(true);
                            }}
                            onEliminar={() => eliminarProducto(producto.id)}
                            onToggleDisponibilidad={() => toggleDisponibilidad(producto)}
                        />
                    ))}
                </div>
            )}

            {/* Modales */}
            {mostrarModal && (
                <ModalProducto
                    producto={productoEditando}
                    categorias={categorias}
                    restauranteId={restauranteId}
                    onClose={() => {
                        setMostrarModal(false);
                        setProductoEditando(null);
                    }}
                    onSuccess={() => {
                        cargarProductos();
                        setMostrarModal(false);
                        setProductoEditando(null);
                    }}
                />
            )}

            {mostrarModalCategoria && (
                <ModalCategorias
                    restauranteId={restauranteId}
                    categorias={categorias}
                    onClose={() => setMostrarModalCategoria(false)}
                    onSuccess={() => {
                        cargarCategorias();
                    }}
                />
            )}
        </div>
    );
};

// ProductoCard (sin cambios, continúa igual...)

// Componente Card de Producto
const ProductoCard = ({ producto, isAdmin, onEditar, onEliminar, onToggleDisponibilidad }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleEliminar = () => {
        setShowConfirm(true);
    };

    const confirmarEliminacion = () => {
        onEliminar();
        setShowConfirm(false);
        setShowMenu(false);
    };

    return (
        <>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                opacity: producto.disponible ? 1 : 0.6
            }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
            >
                {/* Imagen */}
                <div style={{
                    height: '180px',
                    background: producto.imagen_url
                        ? `url(${producto.imagen_url}) center/cover`
                        : 'linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {!producto.imagen_url && (
                        <Package size={48} color="#cbd5e0" />
                    )}

                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: producto.disponible ? '#10B981' : '#EF4444',
                        color: 'white'
                    }}>
                        {producto.disponible ? 'Disponible' : 'No disponible'}
                    </div>

                    {isAdmin && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.9)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <MoreVertical size={18} />
                            </button>

                            {showMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '40px',
                                    right: 0,
                                    background: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    overflow: 'hidden',
                                    zIndex: 10,
                                    minWidth: '160px'
                                }}>
                                    <button
                                        onClick={() => {
                                            onEditar();
                                            setShowMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => {
                                            onToggleDisponibilidad();
                                            setShowMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        {producto.disponible ? <EyeOff size={16} /> : <Eye size={16} />}
                                        {producto.disponible ? 'Desactivar' : 'Activar'}
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleEliminar();
                                            setShowMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#EF4444'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <Trash2 size={16} />
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Información */}
                <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: '#EDF2F7',
                            color: '#4A5568'
                        }}>
                            {producto.categorias?.nombre || 'Sin categoría'}
                        </span>
                    </div>

                    <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1a202c'
                    }}>
                        {producto.nombre}
                    </h3>

                    {producto.descripcion && (
                        <p style={{
                            margin: '0 0 12px 0',
                            fontSize: '13px',
                            color: '#718096',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {producto.descripcion}
                        </p>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <div>
                            <p style={{
                                margin: '0 0 2px 0',
                                fontSize: '12px',
                                color: '#718096'
                            }}>
                                Precio
                            </p>
                            <p style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#FF6B35'
                            }}>
                                ${parseFloat(producto.precio).toFixed(2)}
                            </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <p style={{
                                margin: '0 0 2px 0',
                                fontSize: '12px',
                                color: '#718096'
                            }}>
                                Stock
                            </p>
                            <p style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '600',
                                color: producto.stock > 10 ? '#10B981' : '#EF4444'
                            }}>
                                {producto.stock || 0}
                            </p>
                        </div>
                    </div>

                    {producto.sku && (
                        <p style={{
                            margin: '8px 0 0 0',
                            fontSize: '11px',
                            color: '#a0aec0'
                        }}>
                            SKU: {producto.sku}
                        </p>
                    )}
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1a202c'
                        }}>
                            ¿Eliminar producto?
                        </h3>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: '14px',
                            color: '#718096'
                        }}>
                            Esta acción no se puede deshacer. El producto "{producto.nombre}" será eliminado permanentemente.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            width: window.innerWidth >= 768 ? 'auto' : '100%'
                        }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminacion}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#EF4444',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Modal de Producto con subida de imágenes y agregados
const ModalProducto = ({ producto, categorias, restauranteId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: producto?.nombre || '',
        descripcion: producto?.descripcion || '',
        precio: producto?.precio || '',
        costo: producto?.costo || '',
        categoria_id: producto?.categoria_id || '',
        sku: producto?.sku || '',
        stock: producto?.stock || 0,
        imagen_url: producto?.imagen_url || '',
        disponible: producto?.disponible ?? true,
        agregados: producto?.agregados || []
    });
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [nuevoAgregado, setNuevoAgregado] = useState({ nombre: '', precio: '' });

    // Reiniciar formulario cuando cambia el producto (nuevo o editar)
    useEffect(() => {
        setFormData({
            nombre: producto?.nombre || '',
            descripcion: producto?.descripcion || '',
            precio: producto?.precio || '',
            costo: producto?.costo || '',
            categoria_id: producto?.categoria_id || '',
            sku: producto?.sku || '',
            stock: producto?.stock || 0,
            imagen_url: producto?.imagen_url || '',
            disponible: producto?.disponible ?? true,
            agregados: producto?.agregados || []
        });
        setNuevoAgregado({ nombre: '', precio: '' });
    }, [producto]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        //Previww optimista - mostrar imagen inmediatamente
        const previewUrl = URL.createObjectURL(file);
        setFormData({ ...formData, imagen_url: previewUrl });


        // Validar tipo y tamaño
        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona una imagen', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen no debe superar 5MB', 'error');
            return;
        }

        setUploadingImage(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${restauranteId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('productos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imagen_url: data.publicUrl });
            showToast('Imagen subida correctamente', 'success');
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            showToast('Error al subir imagen', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const agregarAgregado = () => {
        if (!nuevoAgregado.nombre.trim() || !nuevoAgregado.precio) {
            showToast('Completa todos los campos del agregado', 'error');
            return;
        }

        const agregado = {
            id: Date.now().toString(),
            nombre: nuevoAgregado.nombre.trim(),
            precio: parseFloat(nuevoAgregado.precio)
        };

        setFormData({
            ...formData,
            agregados: [...formData.agregados, agregado]
        });

        setNuevoAgregado({ nombre: '', precio: '' });
        showToast('Agregado añadido', 'success');
    };

    const eliminarAgregado = (id) => {
        setFormData({
            ...formData,
            agregados: formData.agregados.filter(a => a.id !== id)
        });
        showToast('Agregado eliminado', 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                restaurante_id: restauranteId,
                precio: parseFloat(formData.precio),
                costo: formData.costo ? parseFloat(formData.costo) : null,
                stock: parseInt(formData.stock) || 0
            };

            if (producto) {
                const { error } = await supabase
                    .from('productos')
                    .update(dataToSave)
                    .eq('id', producto.id);

                if (error) throw error;
                showToast('Producto actualizado correctamente', 'success');
            } else {
                const { error } = await supabase
                    .from('productos')
                    .insert([dataToSave]);

                if (error) throw error;
                showToast('Producto creado correctamente', 'success');
            }

            onSuccess();
        } catch (error) {
            console.error('Error guardando producto:', error);
            showToast('Error al guardar producto: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                maxWidth: '700px',
                margin: window.innerWidth >= 640 ? 'auto' : '0',
                width: window.innerWidth >= 640 ? '100%' : '100vw',
                borderRadius: window.innerWidth >= 640 ? '20px' : '0',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 10
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{
                                margin: '0 0 4px 0',
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1a202c'
                            }}>
                                {producto ? 'Editar Producto' : 'Agregar Producto'}
                            </h2>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#718096'
                            }}>
                                Completa la información del producto
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#f7fafc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f7fafc'}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: window.innerWidth >= 640 ? '24px' : '16px' }}>
                    {/* Imagen del Producto */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748'
                        }}>
                            Imagen del Producto
                        </label>

                        {formData.imagen_url ? (
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={formData.imagen_url}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, imagen_url: '' })}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: '#EF4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Eliminar imagen
                                </button>
                            </div>
                        ) : (
                            <label style={{
                                display: 'block',
                                border: '2px dashed #e2e8f0',
                                borderRadius: '12px',
                                padding: '32px',
                                textAlign: 'center',
                                background: '#f7fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = '#FF6B35';
                                    e.currentTarget.style.background = '#fff5f0';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.background = '#f7fafc';
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploadingImage}
                                />
                                {uploadingImage ? (
                                    <>
                                        <Upload size={40} color="#FF6B35" style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                                        <p style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#FF6B35'
                                        }}>
                                            Subiendo imagen...
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={40} color="#cbd5e0" style={{ marginBottom: '12px' }} />
                                        <p style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#4a5568'
                                        }}>
                                            Haz clic para subir una imagen
                                        </p>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            color: '#a0aec0'
                                        }}>
                                            PNG, JPG hasta 5MB
                                        </p>
                                    </>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Nombre del Producto */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748'
                        }}>
                            Nombre del Producto <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Pizza Margarita"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#FF6B35';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Categoría y SKU */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth >= 640 ? '1fr 1fr' : '1fr',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748'
                            }}>
                                Categoría <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                required
                                value={formData.categoria_id}
                                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Seleccionar categoría</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748'
                            }}>
                                SKU / Código
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: PIZZA-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Precio de Venta y Costo */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth >= 640 ? '1fr 1fr' : '1fr',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748'
                            }}>
                                Precio de Venta <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#718096',
                                    fontWeight: '600'
                                }}>
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={formData.precio}
                                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 32px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748'
                            }}>
                                Costo
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#718096',
                                    fontWeight: '600'
                                }}>
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.costo}
                                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 32px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Disponible */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748'
                        }}>
                            Stock Disponible
                        </label>
                        <input
                            type="number"
                            placeholder="Cantidad en inventario"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '15px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Descripción */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748'
                        }}>
                            Descripción
                        </label>
                        <textarea
                            placeholder="Describe el producto, ingredientes, características..."
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            maxLength={500}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                        />
                        <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: '#a0aec0',
                            textAlign: 'right'
                        }}>
                            {formData.descripcion.length}/500 caracteres
                        </p>
                    </div>

                    {/* Sección de Agregados */}
                    <div style={{
                        padding: '20px',
                        background: '#f7fafc',
                        borderRadius: '12px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1a202c',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Plus size={20} color="#FF6B35" />
                            Agregados (opcional)
                        </h3>
                        {/* Lista de Agregados */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth >= 640 ? '2fr 1fr auto' : '1fr',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <input
                                type="text"
                                placeholder="Nombre del agregado (ej: Extra queso)"
                                value={nuevoAgregado.nombre}
                                onChange={(e) => setNuevoAgregado({ ...nuevoAgregado, nombre: e.target.value })}
                                style={{
                                    padding: '10px 14px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#718096',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={nuevoAgregado.precio}
                                    onChange={(e) => setNuevoAgregado({ ...nuevoAgregado, precio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px 10px 28px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={agregarAgregado}
                                style={{
                                    padding: '10px 16px',
                                    background: '#10B981',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Agregar
                            </button>
                        </div>

                        {/* Lista de agregados */}
                        {formData.agregados.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {formData.agregados.map(agregado => (
                                    <div
                                        key={agregado.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}
                                    >
                                        <div>
                                            <p style={{
                                                margin: '0 0 2px 0',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#1a202c'
                                            }}>
                                                {agregado.nombre}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                color: '#10B981',
                                                fontWeight: '600'
                                            }}>
                                                +${parseFloat(agregado.precio).toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => eliminarAgregado(agregado.id)}
                                            style={{
                                                padding: '6px 10px',
                                                background: '#FEE2E2',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#EF4444',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#a0aec0',
                                textAlign: 'center',
                                padding: '12px'
                            }}>
                                No hay agregados. Puedes añadir extras como "Extra queso", "Doble carne", etc.
                            </p>
                        )}
                    </div>

                    {/* Opciones Adicionales */}
                    <div style={{
                        padding: '16px',
                        background: '#f7fafc',
                        borderRadius: '12px',
                        marginBottom: '24px'
                    }}>
                        <p style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748'
                        }}>
                            Opciones Adicionales
                        </p>

                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#4a5568'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.disponible}
                                onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer'
                                }}
                            />
                            Producto disponible para venta
                        </label>
                    </div>

                    {/* Botones */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        paddingTop: '16px',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '14px',
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#4a5568',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f7fafc';
                                e.currentTarget.style.borderColor = '#cbd5e0';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '14px',
                                background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: loading ? 'none' : '0 4px 12px rgba(255,107,53,0.3)'
                            }}
                            onMouseOver={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,107,53,0.4)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,53,0.3)';
                                }
                            }}
                        >
                            {loading ? 'Guardando...' : (producto ? 'Actualizar Producto' : '+ Agregar Producto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

//Moda de Categorias

// Modal de Categorías con edición y confirmaciones
const ModalCategorias = ({ restauranteId, categorias, onClose, onSuccess }) => {
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const [editandoNombre, setEditandoNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

    const agregarCategoria = async (e) => {
        e.preventDefault();
        if (!nuevaCategoria.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('categorias')
                .insert([{
                    nombre: nuevaCategoria.trim(),
                    restaurante_id: restauranteId
                }]);

            if (error) throw error;

            setNuevaCategoria('');
            onSuccess();
            showToast('Categoría agregada correctamente', 'success');
        } catch (error) {
            console.error('Error agregando categoría:', error);
            showToast('Error al agregar categoría', 'error');
        } finally {
            setLoading(false);
        }
    };

    const actualizarCategoria = async (id) => {
        if (!editandoNombre.trim()) return;

        try {
            const { error } = await supabase
                .from('categorias')
                .update({ nombre: editandoNombre.trim() })
                .eq('id', id);

            if (error) throw error;

            setEditandoId(null);
            setEditandoNombre('');
            onSuccess();
            showToast('Categoría actualizada correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando categoría:', error);
            showToast('Error al actualizar categoría', 'error');
        }
    };

    const eliminarCategoria = async (id) => {
        try {
            const { error } = await supabase
                .from('categorias')
                .delete()
                .eq('id', id);

            if (error) throw error;

            onSuccess();
            setCategoriaAEliminar(null);
            showToast('Categoría eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            showToast('Error al eliminar categoría', 'error');
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    maxWidth: '500px',
                    width: window.innerWidth >= 640 ? '100%' : '100vw',
                    borderRadius: window.innerWidth >= 640 ? '20px' : '0',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{
                                    margin: '0 0 4px 0',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#1a202c'
                                }}>
                                    Gestionar Categorías
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#718096'
                                }}>
                                    Organiza tus productos por categorías
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#f7fafc',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f7fafc'}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Form Nueva Categoría */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                        <form onSubmit={agregarCategoria} style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Nueva categoría..."
                                value={nuevaCategoria}
                                onChange={(e) => setNuevaCategoria(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#FF6B35';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="submit"
                                disabled={loading || !nuevaCategoria.trim()}
                                style={{
                                    padding: '12px 20px',
                                    background: loading || !nuevaCategoria.trim()
                                        ? '#cbd5e0'
                                        : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: loading || !nuevaCategoria.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: loading || !nuevaCategoria.trim()
                                        ? 'none'
                                        : '0 4px 12px rgba(255,107,53,0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Plus size={18} />
                                Agregar
                            </button>
                        </form>
                    </div>

                    {/* Lista de Categorías */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px'
                    }}>
                        {categorias.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                color: '#a0aec0'
                            }}>
                                <Tag size={48} color="#cbd5e0" style={{ marginBottom: '12px' }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    No hay categorías creadas
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {categorias.map((categoria) => (
                                    <div
                                        key={categoria.id}
                                        style={{
                                            padding: '16px',
                                            background: '#f7fafc',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#edf2f7'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#f7fafc'}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Tag size={20} color="white" />
                                        </div>

                                        {editandoId === categoria.id ? (
                                            <input
                                                type="text"
                                                value={editandoNombre}
                                                onChange={(e) => setEditandoNombre(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        actualizarCategoria(categoria.id);
                                                    }
                                                }}
                                                autoFocus
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    border: '2px solid #FF6B35',
                                                    borderRadius: '8px',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    boxShadow: '0 0 0 3px rgba(255,107,53,0.1)'
                                                }}
                                            />
                                        ) : (
                                            <p style={{
                                                flex: 1,
                                                margin: 0,
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                color: '#1a202c'
                                            }}>
                                                {categoria.nombre}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {editandoId === categoria.id ? (
                                                <>
                                                    <button
                                                        onClick={() => actualizarCategoria(categoria.id)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: '#10B981',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = '#10B981'}
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditandoId(null);
                                                            setEditandoNombre('');
                                                        }}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: '#EF4444',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = '#DC2626'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = '#EF4444'}
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditandoId(categoria.id);
                                                            setEditandoNombre(categoria.nombre);
                                                        }}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: 'white',
                                                            color: '#4a5568',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.background = '#3B82F6';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.color = '#4a5568';
                                                        }}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setCategoriaAEliminar(categoria)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: 'white',
                                                            color: '#4a5568',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.background = '#EF4444';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.color = '#4a5568';
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '20px 24px',
                        borderTop: '1px solid #e2e8f0',
                        background: '#f7fafc'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#4a5568',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#edf2f7';
                                e.currentTarget.style.borderColor = '#cbd5e0';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación de Eliminación */}
            {categoriaAEliminar && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '28px',
                        borderRadius: '16px',
                        maxWidth: '420px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#FEE2E2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Trash2 size={28} color="#EF4444" />
                        </div>

                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#1a202c',
                            textAlign: 'center'
                        }}>
                            ¿Eliminar categoría?
                        </h3>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: '15px',
                            color: '#718096',
                            textAlign: 'center',
                            lineHeight: '1.6'
                        }}>
                            Se eliminará la categoría <strong>"{categoriaAEliminar.nombre}"</strong>. Los productos asociados quedarán sin categoría.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            width: window.innerWidth >= 768 ? 'auto' : '100%'
                        }}>
                            <button
                                onClick={() => setCategoriaAEliminar(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#4a5568',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#f7fafc';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'white';
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => eliminarCategoria(categoriaAEliminar.id)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#EF4444',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#DC2626';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#EF4444';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                                }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Productos;
