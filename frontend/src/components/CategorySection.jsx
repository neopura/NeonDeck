import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import ServiceCard from './ServiceCard';

const CategorySection = ({ category, services, onDeleteService, onUpdateCategory, categories, onEditCategory }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (services.length === 0 && !category.id) return null; // Hide empty default 'Uncategorized'

    return (
        <div className="mb-8">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4 group">
                <div
                    className="flex items-center space-x-3 cursor-pointer flex-grow"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div
                        className="w-1.5 h-8 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{
                            backgroundColor: category.color,
                            boxShadow: `0 0 15px ${category.color}40`
                        }}
                    />
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-white transition-colors">
                        {category.name}
                    </h2>
                    <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                            border: `1px solid ${category.color}30`
                        }}
                    >
                        {services.length}
                    </span>
                    <div className="text-gray-500 group-hover:text-cyber-cyan transition-colors ml-2">
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </div>
                </div>

                {/* Edit Category Button */}
                {category.id && onEditCategory && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory(category);
                        }}
                        className="p-2 mr-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-cyber-cyan hover:bg-gray-700/50 transition-all opacity-0 group-hover:opacity-100"
                        title="Category settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Services Grid */}
            {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300 slide-in-from-top-2">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={onDeleteService}
                            onUpdateCategory={onUpdateCategory}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategorySection;
