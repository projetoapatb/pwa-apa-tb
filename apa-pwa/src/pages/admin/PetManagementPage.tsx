import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import type { Pet } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    GripVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

import { writeBatch } from 'firebase/firestore';


const PetManagementPage: React.FC = () => {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpecies, setFilterSpecies] = useState<'TODOS' | 'Cachorro' | 'Gato'>('TODOS');

    useEffect(() => {
        // Buscamos ordenado por sortOrder primeiro, se não existir ele não aparece no orderBy simple
        // Então buscamos tudo e ordenamos na mão para garantir que nada suma enquanto migramos
        const q = query(collection(db, 'pets'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const petData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Pet[];

            // Ordenação local: sortOrder (ASC) ou createdAt (DESC) como fallback
            const sortedData = [...petData].sort((a, b) => {
                const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

                if (orderA !== orderB) return orderA - orderB;

                // Fallback para data de criação (mais novos primeiro se não houver ordem)
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });

            setPets(sortedData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(pets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Atualização otimista do estado local
        setPets(items);

        // Atualização no Firestore em lote
        try {
            const batch = writeBatch(db);
            items.forEach((pet, index) => {
                const petRef = doc(db, 'pets', pet.id);
                batch.update(petRef, { sortOrder: index });
            });
            await batch.commit();
        } catch (error) {
            console.error("Erro ao salvar nova ordem:", error);
            alert("Erro ao salvar a ordem dos animais.");
        }
    };


    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir permanentemente o registro de ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'pets', id));
            } catch (error) {
                console.error("Erro ao excluir:", error);
                alert("Erro ao excluir animal.");
            }
        }
    };

    const filteredPets = pets.filter(pet => {
        const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecies = filterSpecies === 'TODOS' || pet.species === filterSpecies;
        return matchesSearch && matchesSpecies;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com Ações */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Gestão de Animais</p>
                    <h2 className="text-2xl font-bold text-gray-800">Todos os Pets ({pets.length})</h2>
                </div>
                <Link to="/anunciar-pet">
                    <Button className="gap-2 px-6">
                        <Plus size={20} /> Novo Cadastro
                    </Button>
                </Link>
            </div>

            {/* Filtros e Busca */}
            <Card className="p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou raça..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-brand-green transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['TODOS', 'Cachorro', 'Gato'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterSpecies(s as any)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterSpecies === s ? 'bg-brand-green text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Tabela / Grid de Pets */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Animal</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Espécie/Porte</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Data</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>

                        </thead>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="pets-list">
                                {(provided) => (
                                    <tbody
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="divide-y divide-gray-50"
                                    >
                                        {filteredPets.map((pet, index) => (
                                            <Draggable key={pet.id} draggableId={pet.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <tr
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`transition-colors group ${snapshot.isDragging ? 'bg-brand-green/10 shadow-lg' : 'hover:bg-gray-50/50'}`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-brand-green transition-colors">
                                                                <GripVertical size={20} />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                                    <img src={pet.photos[0]} className="w-full h-full object-cover" alt={pet.name} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{pet.name}</p>
                                                                    <p className="text-xs text-gray-400">{pet.breed || 'SRD'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-sm font-medium text-gray-600">{pet.species}</span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Porte {pet.size}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge
                                                                variant={pet.status === 'disponível' ? 'success' : pet.status === 'pendente' ? 'warning' : 'info'}
                                                                className="uppercase text-[10px]"
                                                            >
                                                                {pet.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-500">
                                                                {pet.createdAt?.toDate ? pet.createdAt.toDate().toLocaleDateString('pt-BR') : '---'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Link to={`/admin/caes/editar/${pet.id}`}>
                                                                    <Button variant="outline" size="sm" className="p-2 h-auto rounded-lg hover:border-brand-green hover:bg-green-50">
                                                                        <Edit2 size={16} className="text-gray-400 group-hover:text-brand-green" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="p-2 h-auto rounded-lg hover:border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleDelete(pet.id, pet.name)}
                                                                >
                                                                    <Trash2 size={16} className="text-red-400" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        </DragDropContext>

                    </table>
                </div>
                {filteredPets.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-gray-400">Nenhum animal encontrado com esses filtros.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetManagementPage;
