import React, { useState, useEffect } from 'react';
import { X, Edit3, Type, Palette, Layout, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { categoriesAPI } from '../services/api';

const EditCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated, onCategoryDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        icon: 'folder',
        color: '#00d9ff',
        order_index: 0
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                icon: category.icon || 'folder',
                color: category.color || '#00d9ff',
                order_index: category.order_index || 0
            });
        }
    }, [category]);

    if (!isOpen || !category) return null;

    const colors = [
        { name: 'Cyan', value: '#00d9ff' },
        { name: 'Magenta', value: '#ff00ff' },
        { name: 'Purple', value: '#b026ff' },
        { name: 'Pink', value: '#ff0080' },
        { name: 'Blue', value: '#0080ff' },
        { name: 'Green', value: '#00ffaa' },
        { name: 'Red', value: '#ff4444' },
        { name: 'Orange', value: '#ea580c' },
        { name: 'Gray', value: '#888888' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Category name is required');
            return;
        }

        try {
            setLoading(true);
            const response = await categoriesAPI.update(category.id, formData);
            toast.success('Category updated successfully!');
            onCategoryUpdated(response.data);
            onClose();
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(error.response?.data?.detail || 'Failed to update category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            await categoriesAPI.delete(category.id);
            toast.success('Category deleted successfully!');
            onCategoryDeleted(category.id);
            onClose();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-cyber-dark border border-cyber-cyan/30 rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.1)] overflow-hidden">

                {showDeleteConfirm ? (
                    <div className="p-8 text-center animate-in zoom-in duration-200">
                        <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Delete Category?</h3>
                        <p className="text-gray-400 mb-6 font-light">
                            Are you sure you want to delete <span className="text-cyber-cyan font-bold">{category.name}</span>?<br />
                            This will move all services in this category to <span className="italic">Uncategorized</span>.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-cyber-cyan/20">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Edit3 className="w-5 h-5 mr-2 text-cyber-cyan" />
                                Edit Category
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                                    <Type className="w-4 h-4 mr-2 text-cyber-cyan" />
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-cyber-darker border border-cyber-cyan/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                                    <Palette className="w-4 h-4 mr-2 text-cyber-magenta" />
                                    Theme Color
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`w-full aspect-square rounded-lg border-2 transition-all transform hover:scale-110 ${formData.color === color.value
                                                    ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                    : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                                    <Layout className="w-4 h-4 mr-2 text-gray-500" />
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-cyber-darker border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="pt-4 flex flex-col space-y-3">
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-white/5 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-2 px-6 py-2.5 bg-gradient-to-r from-cyber-cyan to-blue-600 rounded-lg text-black font-bold hover:shadow-[0_0_15px_rgba(0,217,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center">
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium flex items-center justify-center border border-red-500/20"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete This Category
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditCategoryModal;
