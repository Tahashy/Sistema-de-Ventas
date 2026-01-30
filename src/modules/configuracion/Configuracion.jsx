import React, { useState, useEffect } from 'react';
import {
    Settings,
    Clock,
    Users,
    Shield,
    Save,
    Plus,
    Edit,
    Trash2,
    Check,
    X,
    CreditCard,
    Lock,
    LogOut,
    Printer,
    Image as ImageIcon,
    Upload,
    Type
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import {
    getRestaurantInfo, updateRestaurantInfo,
    getSchedules, saveSchedules,
    getUsers, createUser, updateUser, deleteUser
} from '../../services/configuracionService';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from './LanguageContext';
import { changePassword } from '../../services/seguridadService';

const Configuracion = ({ restauranteId }) => {
    const [activeTab, setActiveTab] = useState('general');
    const { user, logout, refreshRestaurant } = useAuth();
    const { changeLanguage, t } = useLanguage();
    const isAdmin = user?.rol === 'admin';

    // -- ESTADOS: GENERAL --
    const [generalInfo, setGeneralInfo] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        email_contacto: '',
        moneda: 'USD',
        idioma: 'es',
        pais: 'PE', // Default Perú
        zona_horaria: 'America/Lima',
        logo_url: '',
        ticket_config: { show_logo: true, header_msg: '', footer_msg: '¡Gracias por su visita!' }
    });

    // -- ESTADOS: HORARIOS --
    const [horarios, setHorarios] = useState([]);

    // -- ESTADOS: USUARIOS --
    const [usuarios, setUsuarios] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'camarero'
    });

    // -- ESTADOS: SEGURIDAD --
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // -- CARGA INICIAL --
    useEffect(() => {
        loadData();
    }, [restauranteId, activeTab]);

    const loadData = async () => {
        if (activeTab === 'general') {
            const data = await getRestaurantInfo(restauranteId);
            if (data) {
                setGeneralInfo(data);
                if (data.idioma) changeLanguage(data.idioma);
            }
        } else if (activeTab === 'horarios') {
            const data = await getSchedules(restauranteId); // Await because service is now async
            setHorarios(data);
        } else if (activeTab === 'usuarios') {
            const data = await getUsers(restauranteId);
            setUsuarios(data || []);
        }
    };

    // -- HANDLERS: GENERAL --
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) { // 500KB limit
            showToast(t('error_imagen_grande'), 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setGeneralInfo({ ...generalInfo, logo_url: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveGeneral = async () => {
        try {
            await updateRestaurantInfo(restauranteId, generalInfo);
            changeLanguage(generalInfo.idioma); // Actualizar contexto
            await refreshRestaurant(); // Actualizar contexto global (Sidebar, Tickets)
            showToast('Información general actualizada', 'success');
        } catch (error) {
            showToast('Error al actualizar', 'error');
        }
    };

    // -- HANDLERS: HORARIOS --
    const handleSaveHorarios = async () => {
        try {
            await saveSchedules(restauranteId, horarios);
            showToast('Horarios guardados', 'success');
        } catch (error) {
            showToast('Error al guardar horarios', 'error');
        }
    };

    const toggleDiaAbierto = (index) => {
        const newHorarios = [...horarios];
        newHorarios[index].abierto = !newHorarios[index].abierto;
        setHorarios(newHorarios);
    };

    const updateHorario = (index, field, value) => {
        const newHorarios = [...horarios];
        newHorarios[index][field] = value;
        setHorarios(newHorarios);
    };

    // -- HANDLERS: USUARIOS --
    const handleOpenUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({ nombre: user.nombre, email: user.email, password: user.password, rol: user.rol });
        } else {
            setEditingUser(null);
            setUserForm({ nombre: '', email: '', password: '', rol: 'camarero' });
        }
        setShowUserModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(editingUser.id, userForm);
                showToast('Usuario actualizado', 'success');
            } else {
                await createUser({ ...userForm, restaurante_id: restauranteId });
                showToast('Usuario creado', 'success');
            }
            setShowUserModal(false);
            loadData(); // Recargar lista
        } catch (error) {
            showToast('Error al guardar usuario', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await deleteUser(id);
                showToast('Usuario eliminado', 'success');
                loadData();
            } catch (error) {
                showToast('Error al eliminar usuario', 'error');
            }
        }
    };


    // -- RENDERIZADO --

    // TAB: GENERAL
    const renderGeneral = () => (
        <div className="card-config">
            <h3>{t('info_restaurante')}</h3>
            <div className="grid-2">
                <div className="form-group">
                    <label>{t('nombre_restaurante')}</label>
                    <input
                        type="text"
                        value={generalInfo.nombre || ''}
                        onChange={e => setGeneralInfo({ ...generalInfo, nombre: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>{t('email_contacto')}</label>
                    <input
                        type="email"
                        value={generalInfo.email_contacto || ''}
                        onChange={e => setGeneralInfo({ ...generalInfo, email_contacto: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>{t('telefono')}</label>
                    <input
                        type="text"
                        value={generalInfo.telefono || ''}
                        onChange={e => setGeneralInfo({ ...generalInfo, telefono: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>{t('direccion')}</label>
                    <input
                        type="text"
                        value={generalInfo.direccion || ''}
                        onChange={e => setGeneralInfo({ ...generalInfo, direccion: e.target.value })}
                    />
                </div>
            </div>

            <h3 style={{ marginTop: '24px' }}>{t('pref_regionales')}</h3>
            <div className="grid-2">
                <div className="form-group">
                    <label>{t('pais_zona')}</label>
                    <select
                        value={generalInfo.pais || 'PE'}
                        onChange={e => {
                            const pais = e.target.value;
                            let zona = 'America/Lima';
                            let moneda = generalInfo.moneda;

                            // Auto-asignar zona horaria y moneda sugerida según país
                            switch (pais) {
                                case 'PE': zona = 'America/Lima'; moneda = 'PEN'; break;
                                case 'MX': zona = 'America/Mexico_City'; moneda = 'MXN'; break;
                                case 'CO': zona = 'America/Bogota'; moneda = 'COP'; break;
                                case 'ES': zona = 'Europe/Madrid'; moneda = 'EUR'; break;
                                case 'AR': zona = 'America/Argentina/Buenos_Aires'; moneda = 'ARS'; break;
                                case 'CL': zona = 'America/Santiago'; moneda = 'CLP'; break;
                                case 'US': zona = 'America/New_York'; moneda = 'USD'; break;
                                default: zona = 'UTC';
                            }
                            setGeneralInfo({ ...generalInfo, pais, zona_horaria: zona, moneda });
                        }}
                    >
                        <option value="PE">Perú (GMT-5)</option>
                        <option value="MX">México (GMT-6)</option>
                        <option value="CO">Colombia (GMT-5)</option>
                        <option value="ES">España (GMT+1)</option>
                        <option value="AR">Argentina (GMT-3)</option>
                        <option value="CL">Chile (GMT-4)</option>
                        <option value="US">Estados Unidos (ET)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>{t('moneda')}</label>
                    <select
                        value={generalInfo.moneda || 'PEN'}
                        onChange={e => setGeneralInfo({ ...generalInfo, moneda: e.target.value })}
                    >
                        <option value="PEN">Sol Peruano (PEN)</option>
                        <option value="USD">Dólar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="COP">Peso Colombiano (COP)</option>
                        <option value="MXN">Peso Mexicano (MXN)</option>
                        <option value="ARS">Peso Argentino (ARS)</option>
                        <option value="CLP">Peso Chileno (CLP)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>{t('idioma')}</label>
                    <select
                        value={generalInfo.idioma || 'es'}
                        onChange={e => setGeneralInfo({ ...generalInfo, idioma: e.target.value })}
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div className="actions-row">
                <button className="btn-save" onClick={handleSaveGeneral}>
                    <Save size={18} /> {t('guardar_cambios')}
                </button>
            </div>
        </div>
    );

    // TAB: HORARIOS
    const renderHorarios = () => (
        <div className="card-config premium-shadow">
            <h3 className="section-title">Horarios de Atención</h3>
            <p style={{ color: '#718096', marginBottom: '24px' }}>Configura los días y horarios en los que tu negocio está abierto.</p>

            <div className="horarios-grid">
                {horarios.map((h, index) => (
                    <div key={index} className={`horario-card ${!h.abierto ? 'cerrado' : ''}`}>
                        <div className="horario-card-header">
                            <span className="dia-badge">{h.dia.substring(0, 3).toUpperCase()}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={h.abierto}
                                    onChange={() => toggleDiaAbierto(index)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {h.abierto ? (
                            <div className="horario-times">
                                <div className="time-block">
                                    <label>Apertura</label>
                                    <input
                                        type="time"
                                        value={h.inicio}
                                        onChange={e => updateHorario(index, 'inicio', e.target.value)}
                                    />
                                </div>
                                <div className="time-block">
                                    <label>Cierre</label>
                                    <input
                                        type="time"
                                        value={h.fin}
                                        onChange={e => updateHorario(index, 'fin', e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="cerrado-label">Cerrado</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="actions-row">
                <button className="btn-save premium-btn" onClick={handleSaveHorarios}>
                    <Save size={18} /> {t('guardar_cambios')}
                </button>
            </div>
        </div>
    );

    // TAB: USUARIOS
    const renderUsuarios = () => (
        <div>
            <div className="header-actions">
                <h3>Gestión de Usuarios</h3>
                <button className="btn-add" onClick={() => handleOpenUserModal()}>
                    <Plus size={18} /> Agregar Usuario
                </button>
            </div>

            <div className="users-grid">
                {usuarios.map(u => (
                    <div key={u.id} className="user-card">
                        <div className="user-avatar">
                            {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <h4>{u.nombre}</h4>
                            <p>{u.email}</p>
                            <span className={`rol-badge ${u.rol}`}>{u.rol}</span>
                        </div>
                        <div className="user-actions">
                            <button onClick={() => handleOpenUserModal(u)} className="btn-icon edit">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="btn-icon delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Crear/Editar Usuario */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setShowUserModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveUser}>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    required
                                    value={userForm.nombre}
                                    onChange={e => setUserForm({ ...userForm, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <input
                                    required={!editingUser}
                                    type="text" // Visible para demo/facilidad
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder={editingUser ? "Dejar vacío para mantener actual" : ""}
                                />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={userForm.rol}
                                    onChange={e => setUserForm({ ...userForm, rol: e.target.value })}
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="camarero">Camarero</option>
                                    <option value="cocinero">Cocinero</option>
                                    <option value="cajero">Cajero</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowUserModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    // TAB: SEGURIDAD
    const renderSeguridad = () => (
        <div className="card-config premium-shadow">
            <h3 className="section-title">Seguridad y Privacidad</h3>

            <div className="security-card">
                <div className="sec-header">
                    <div className="sec-icon">
                        <Shield size={24} color="#FF6B35" />
                    </div>
                    <div>
                        <h4>{t('cambiar_contrasena')}</h4>
                        <p>{t('cambiar_contrasena_desc')}</p>
                    </div>
                </div>

                <div className="password-change-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>{t('contrasena_actual')}</label>
                            <div className="input-with-icon">
                                <Lock size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('nueva_contrasena')}</label>
                            <div className="input-with-icon">
                                <Lock size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('confirmar_contrasena')}</label>
                            <div className="input-with-icon">
                                <Check size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            className="btn-save"
                            onClick={async () => {
                                if (!passwordForm.currentPassword || !passwordForm.newPassword) {
                                    showToast(t('campos_requeridos'), 'error');
                                    return;
                                }
                                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                                    showToast(t('contrasenas_no_coinciden'), 'error');
                                    return;
                                }

                                const result = await changePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword);
                                if (result.success) {
                                    showToast(t('contrasena_actualizada'), 'success');
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                } else {
                                    showToast(result.error || 'Error', 'error');
                                }
                            }}
                        >
                            <Shield size={16} /> {t('actualizar_contrasena')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="security-section">
                <div className="sec-header">
                    <div className="sec-icon danger">
                        <LogOut size={24} color="#e53e3e" />
                    </div>
                    <div>
                        <h4>{t('control_sesion')}</h4>
                        <p>{t('control_sesion_desc')}</p>
                    </div>
                </div>
                <button
                    className="btn-outline danger"
                    onClick={() => {
                        if (window.confirm(t('confirmar_cerrar_sesion'))) {
                            logout();
                        }
                    }}
                >
                    <LogOut size={16} />
                    {t('cerrar_sesion_btn')}
                </button>
            </div>
        </div>
    );

    // TAB: PREFERENCIAS
    const renderPreferencias = () => (
        <div className="card-config premium-shadow">
            <h3 className="section-title">{t('preferencias')}</h3>

            <div className="pref-grid">
                {/* Columna Izq: Configuración */}
                <div className="config-column">

                    {/* SECCIÓN: MARCA */}
                    <div className="config-group">
                        <h4 className="group-title">
                            <Type size={18} /> Información del Negocio
                        </h4>

                        <div className="form-group">
                            <label>{t('nombre_negocio')}</label>
                            <input
                                className="modern-input"
                                type="text"
                                value={generalInfo.nombre || ''}
                                onChange={e => setGeneralInfo({ ...generalInfo, nombre: e.target.value })}
                                placeholder={t('nombre_negocio_placeholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('direccion')}</label>
                            <input
                                className="modern-input"
                                type="text"
                                value={generalInfo.direccion || ''}
                                onChange={e => setGeneralInfo({ ...generalInfo, direccion: e.target.value })}
                                placeholder="Ej: Av. Principal 123"
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('telefono')}</label>
                            <input
                                className="modern-input"
                                type="text"
                                value={generalInfo.telefono || ''}
                                onChange={e => setGeneralInfo({ ...generalInfo, telefono: e.target.value })}
                                placeholder="Ej: +51 999 999 999"
                            />
                        </div>
                    </div>

                    <div className="config-group">
                        <h4 className="group-title">
                            <ImageIcon size={18} /> Logo
                        </h4>

                        <div className="logo-upload-area">
                            <input
                                type="file"
                                id="logo-upload"
                                accept="image/png, image/jpeg"
                                onChange={handleLogoUpload}
                                className="hidden-input"
                            />
                            <label htmlFor="logo-upload" className="upload-label">
                                {generalInfo.logo_url ? (
                                    <div className="preview-mini">
                                        <img src={generalInfo.logo_url} alt="Logo Preview" />
                                        <div className="overlay">
                                            <Upload size={20} />
                                            <span>{t('cambiar_logo')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="placeholder-upload">
                                        <div className="icon-circle">
                                            <Upload size={24} color="#FF6B35" />
                                        </div>
                                        <span>{t('subir_logo')}</span>
                                        <small>{t('logo_desc')}</small>
                                    </div>
                                )}
                            </label>
                            {generalInfo.logo_url && (
                                <button
                                    className="btn-text-danger"
                                    onClick={() => setGeneralInfo({ ...generalInfo, logo_url: '' })}
                                >
                                    Eliminar Logo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN: TICKET */}
                    <div className="config-group">
                        <h4 className="group-title">
                            <Printer size={18} /> Configuración de Ticket
                        </h4>

                        <div className="ticket-options">
                            <label className="checkbox-card">
                                <input
                                    type="checkbox"
                                    checked={generalInfo.ticket_config?.show_logo !== false}
                                    onChange={e => setGeneralInfo({
                                        ...generalInfo,
                                        ticket_config: { ...generalInfo.ticket_config, show_logo: e.target.checked }
                                    })}
                                />
                                <div className="cb-content">
                                    <span className="cb-title">{t('mostrar_logo_ticket')}</span>
                                </div>
                                <div className={`cb-indicator ${generalInfo.ticket_config?.show_logo !== false ? 'active' : ''}`}></div>
                            </label>

                            <div className="form-group">
                                <label>{t('mensaje_cabecera')}</label>
                                <input
                                    className="modern-input"
                                    type="text"
                                    value={generalInfo.ticket_config?.header_msg || ''}
                                    onChange={e => setGeneralInfo({
                                        ...generalInfo,
                                        ticket_config: { ...generalInfo.ticket_config, header_msg: e.target.value }
                                    })}
                                    placeholder="Ej: Bienvenido"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('mensaje_pie')}</label>
                                <input
                                    className="modern-input"
                                    type="text"
                                    value={generalInfo.ticket_config?.footer_msg || ''}
                                    onChange={e => setGeneralInfo({
                                        ...generalInfo,
                                        ticket_config: { ...generalInfo.ticket_config, footer_msg: e.target.value }
                                    })}
                                    placeholder="Ej: Gracias por su visita"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Der: Vista Previa */}
                <div className="preview-column">
                    <div className="sticky-preview">
                        <h4 className="preview-title">{t('vista_previa_ticket')}</h4>

                        <div className="ticket-paper">
                            {/* Header Ticket */}
                            <div className="ticket-header">
                                {generalInfo.ticket_config?.show_logo !== false && generalInfo.logo_url && (
                                    <img
                                        src={generalInfo.logo_url}
                                        alt="Logo"
                                        className="ticket-logo"
                                    />
                                )}
                                <div className="ticket-biz-name">{generalInfo.nombre || 'Nombre Negocio'}</div>
                                <div className="ticket-info">{generalInfo.direccion || 'Dirección...'}</div>
                                <div className="ticket-info">Tel: {generalInfo.telefono || '...'}</div>
                                {generalInfo.ticket_config?.header_msg && (
                                    <div className="ticket-msg-header">{generalInfo.ticket_config.header_msg}</div>
                                )}
                            </div>

                            {/* Body Mock */}
                            <div className="ticket-body">
                                <div className="ticket-row">Pedido: #1001</div>
                                <div className="ticket-row">Cliente: Juan Pérez</div>
                                <div className="ticket-divider"></div>
                                <div className="ticket-item">
                                    <span>2 x Hamburguesa Clásica</span>
                                    <span>$ 20.00</span>
                                </div>
                                <div className="ticket-item">
                                    <span>1 x Gaseosa 500ml</span>
                                    <span>$ 5.00</span>
                                </div>
                            </div>

                            {/* Totales Mock */}
                            <div className="ticket-totals">
                                <div className="ticket-total-row">
                                    <span>TOTAL:</span>
                                    <span>$ 25.00</span>
                                </div>
                            </div>

                            {/* Footer Ticket */}
                            <div className="ticket-footer">
                                {generalInfo.ticket_config?.footer_msg || '¡Gracias por su visita!'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="actions-row">
                <button className="btn-save premium-btn" onClick={handleSaveGeneral}>
                    <Save size={18} /> {t('guardar_cambios')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="configuracion-container">
            <div className="config-header">
                <h1>{t('config_titulo')}</h1>
                <p>{t('config_desc')}</p>
            </div>

            {/* Tabs Header */}
            <div className="tabs-header">
                {[
                    { id: 'general', label: t('general'), icon: Settings },
                    { id: 'preferencias', label: t('preferencias'), icon: Printer },
                    { id: 'horarios', label: t('horarios'), icon: Clock },
                    { id: 'usuarios', label: t('usuarios'), icon: Users },
                    { id: 'seguridad', label: t('seguridad'), icon: Shield }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="tab-content">
                {activeTab === 'general' && renderGeneral()}
                {activeTab === 'preferencias' && renderPreferencias()}
                {activeTab === 'horarios' && renderHorarios()}
                {activeTab === 'usuarios' && renderUsuarios()}
                {activeTab === 'seguridad' && renderSeguridad()}
            </div>

            {/* Styles inline for speed, ideally in CSS module */}
            <style>{`
                .configuracion-container { padding: 32px; max-width: 1200px; margin: 0 auto; }
                .config-header { margin-bottom: 32px; }
                .config-header h1 { font-size: 28px; font-weight: 800; color: #1a202c; margin: 0; }
                .config-header p { color: #718096; margin-top: 4px; }
                
                .tabs-header { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
                .tab-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 12px 20px;
                    border: none; background: none;
                    font-size: 15px; font-weight: 600; color: #718096;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .tab-btn:hover { color: #4a5568; }
                .tab-btn.active { color: #FF6B35; border-bottom-color: #FF6B35; }

                .card-config { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
                
                /* RESPONSIVE GENERAL */
                @media (max-width: 768px) {
                    .configuracion-container { padding: 16px; }
                    .config-header h1 { font-size: 22px; }
                    .tabs-header { flex-wrap: wrap; gap: 4px; }
                    .tab-btn { padding: 10px 12px; font-size: 13px; }
                    .tab-btn span { display: none; } /* Hide text, show only icon on mobile */
                    .grid-2 { grid-template-columns: 1fr; }
                    .card-config { padding: 16px; }
                    .pref-grid { grid-template-columns: 1fr !important; }
                    .preview-column { margin-top: 24px; }
                }
                
                .form-group { display: flex; flexDirection: column; gap: 8px; margin-bottom: 16px; }
                .form-group label { font-size: 14px; font-weight: 600; color: #4a5568; }
                .form-group input, .form-group select {
                    padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
                    font-size: 15px;
                }
                .form-group input:focus { outline: none; border-color: #FF6B35; }

                .actions-row { margin-top: 24px; display: flex; justify-content: flex-end; }
                .btn-save {
                    background: #FF6B35; color: white; border: none; padding: 10px 24px;
                    border-radius: 8px; font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; gap: 8px;
                }

                /* HORARIOS PREMIUM GRID */
                .horarios-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 16px;
                }
                .horario-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.2s;
                }
                .horario-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                .horario-card.cerrado { background: #f7fafc; opacity: 0.7; }
                .horario-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .dia-badge {
                    font-weight: 700;
                    font-size: 14px;
                    color: #2d3748;
                    background: #edf2f7;
                    padding: 4px 12px;
                    border-radius: 6px;
                }
                .horario-times { display: flex; flex-direction: column; gap: 10px; }
                .time-block label { font-size: 11px; color: #718096; display: block; margin-bottom: 4px; }
                .time-block input[type="time"] {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                }
                .cerrado-label {
                    text-align: center;
                    color: #a0aec0;
                    font-size: 13px;
                    padding: 20px 0;
                }
                
                /* TOGGLE SWITCH */
                .toggle-switch {
                    position: relative;
                    width: 40px;
                    height: 22px;
                }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .toggle-switch .slider {
                    position: absolute;
                    cursor: pointer;
                    inset: 0;
                    background: #cbd5e0;
                    border-radius: 22px;
                    transition: 0.3s;
                }
                .toggle-switch .slider::before {
                    content: "";
                    position: absolute;
                    height: 16px;
                    width: 16px;
                    left: 3px;
                    bottom: 3px;
                    background: white;
                    border-radius: 50%;
                    transition: 0.3s;
                }
                .toggle-switch input:checked + .slider { background: #48bb78; }
                .toggle-switch input:checked + .slider::before { transform: translateX(18px); }

                /* SECURITY CARD */
                .security-card {
                    background: #f8fafc;
                    border: 1px solid #edf2f7;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }
                .sec-header {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                .sec-icon {
                    width: 48px;
                    height: 48px;
                    background: #FFF5F1;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .sec-icon.danger { background: #fee2e2; }
                .sec-header h4 { margin: 0 0 4px 0; font-size: 18px; color: #2d3748; }
                .sec-header p { margin: 0; color: #718096; font-size: 14px; }
                .password-change-form {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid #edf2f7;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-with-icon svg {
                    position: absolute;
                    left: 12px;
                    color: #a0aec0;
                }
                .input-with-icon input {
                    width: 100%;
                    padding: 10px 10px 10px 40px !important;
                }
                .form-actions { display: flex; justify-content: flex-end; }

                /* LOGO PREVIEW SMALLER */
                .preview-mini { 
                    width: 80px; 
                    height: 80px; 
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin: 0 auto;
                }
                .preview-mini img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                }
                .placeholder-upload { 
                    padding: 16px; 
                    width: 120px;
                    margin: 0 auto;
                }
                .icon-circle { width: 36px; height: 36px; }
                .logo-upload-area { text-align: center; }

                
                .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .btn-add {
                    background: #FF6B35; color: white; border: none; padding: 10px 16px;
                    border-radius: 8px; font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; gap: 8px;
                }
                .btn-outline {
                    background: transparent;
                    border: 2px solid #e2e8f0;
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    color: #4a5568;
                    transition: all 0.2s ease;
                    font-size: 15px;
                }
                .btn-outline:hover {
                    background: #f7fafc;
                    border-color: #cbd5e0;
                    color: #2d3748;
                    transform: translateY(-1px);
                }
                
                .btn-outline.danger {
                    border-color: #feb2b2;
                    color: #e53e3e;
                    background: #fff5f5;
                }
                .btn-outline.danger:hover {
                    background: #e53e3e;
                    color: white;
                    border-color: #e53e3e;
                    box-shadow: 0 4px 6px rgba(229, 62, 62, 0.2);
                }

                .users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
                .user-card {
                    background: white; padding: 20px; border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    display: flex; align-items: center; gap: 16px;
                }
                .user-avatar {
                    width: 48px; height: 48px; border-radius: 50%;
                    background: #edf2f7; color: #4a5568;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; font-weight: 700;
                }
                .user-info { flex: 1; min-width: 0; }
                .user-info h4 { margin: 0; color: #2d3748; }
                .user-info p { margin: 4px 0; color: #718096; font-size: 13px; overflow: hidden; text-overflow: ellipsis; }
                .rol-badge {
                    display: inline-block; padding: 2px 8px; border-radius: 12px;
                    font-size: 11px; font-weight: 600; text-transform: uppercase;
                }
                .rol-badge.admin { background: #fed7d7; color: #c53030; }
                .rol-badge.camarero { background: #bee3f8; color: #2b6cb0; }
                .rol-badge.cocinero { background: #feebc8; color: #c05621; }
                .rol-badge.cajero { background: #c6f6d5; color: #2f855a; }

                .user-actions { display: flex; gap: 8px; }
                .btn-icon {
                    width: 32px; height: 32px; border-radius: 6px; border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .btn-icon.edit { background: #edf2f7; color: #4a5568; }
                .btn-icon.delete { background: #fff5f5; color: #fc8181; }
                .btn-icon:hover { transform: scale(1.1); }

                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                }
                .modal-content {
                    background: white; padding: 24px; border-radius: 16px; width: 400px;
                }
                .modal-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                /* PREMIUM STYLES */
                .premium-shadow {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    padding: 32px;
                }
                .section-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 32px;
                    color: #1a202c;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .pref-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 40px;
                }
                @media (max-width: 1024px) {
                    .pref-grid { grid-template-columns: 1fr; }
                }

                .group-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #4a5568;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .config-group {
                    margin-bottom: 32px;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #edf2f7;
                }

                /* LOGO UPLOAD */
                .hidden-input { display: none; }
                .upload-label { cursor: pointer; display: block; }
                .logo-upload-area {
                    text-align: center;
                }
                .placeholder-upload {
                    border: 2px dashed #cbd5e0;
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: #718096;
                    transition: all 0.2s;
                    background: white;
                }
                .placeholder-upload:hover {
                    border-color: #FF6B35;
                    background: #fffafa;
                    color: #FF6B35;
                }
                .icon-circle {
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    background: #FFF5F1;
                    display: flex;align-items:center;justify-content:center;
                }
                .preview-mini {
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .preview-mini img {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .preview-mini .overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .preview-mini:hover .overlay { opacity: 1; }
                .btn-text-danger {
                    background: none; border: none; color: #e53e3e; font-size: 13px;
                    margin-top: 8px; cursor: pointer; text-decoration: underline;
                }

                /* MODERN INPUTS */
                .modern-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }
                .modern-input:focus {
                    outline: none;
                    border-color: #FF6B35;
                    box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
                }

                /* CHECKBOX CARD */
                .checkbox-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                    padding: 16px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    margin-bottom: 16px;
                    transition: all 0.2s;
                }
                .checkbox-card:hover {
                    border-color: #cbd5e0;
                }
                .checkbox-card input { display: none; }
                .cb-indicator {
                    width: 20px; height: 20px;
                    border: 2px solid #cbd5e0;
                    border-radius: 6px;
                    position: relative;
                }
                .cb-indicator.active {
                    background: #FF6B35;
                    border-color: #FF6B35;
                }
                .cb-indicator.active::after {
                    content: '';
                    position: absolute;
                    left: 6px; top: 2px;
                    width: 5px; height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                /* TICKET PREVIEW */
                .preview-column {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 20px;
                    background: #e2e8f0;
                    border-radius: 20px;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
                }
                .sticky-preview { position: sticky; top: 20px; width: 100%; max-width: 320px; }
                .preview-title { text-align: center; margin-bottom: 16px; color: #4a5568; font-weight: 600; }
                
                .ticket-paper {
                    background: #fff;
                    padding: 24px;
                    border-radius: 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    position: relative;
                    /* Zig-zag border via custom css or image, keeping simple for now */
                    border-top: 1px solid #f0f0f0;
                }
                .ticket-paper::before, .ticket-paper::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 10px;
                    background: linear-gradient(-45deg, transparent 16px, transparent 0), linear-gradient(45deg, transparent 16px, transparent  0);
                    background-size: 20px 20px;
                    background-repeat: repeat-x;
                }
                /* Header */
                .ticket-logo { width: 80px; display: block; margin: 0 auto 12px auto; }
                .ticket-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
                .ticket-biz-name { font-size: 16px; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; }
                .ticket-info { color: #555; margin-bottom: 2px; }
                .ticket-msg-header { margin-top: 8px; font-weight: 600; font-style: italic; }

                /* Body */
                .ticket-body { margin-bottom: 12px; }
                .ticket-divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                .ticket-item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                
                /* Totals */
                .ticket-totals { border-top: 2px dashed #000; padding-top: 8px; text-align: right; margin-bottom: 16px; }
                .ticket-total-row { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; }

                /* Footer */
                .ticket-footer { text-align: center; font-size: 11px; color: #444; }

                .premium-btn {
                    padding: 12px 24px;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                }
                .premium-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
                }
            `}</style>
        </div>
    );
};

export default Configuracion;
