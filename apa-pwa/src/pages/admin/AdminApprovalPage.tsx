import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Pet } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Check,
    X,
    Clock,
    Trash2,
    MapPin,
    Phone,
    User
} from 'lucide-react';

const AdminApprovalPage: React.FC = () => {
    const [pendingPets, setPendingPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'pets'),
            where('status', '==', 'pendente'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const pets = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Pet[];
            setPendingPets(pets);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await updateDoc(doc(db, 'pets', id), {
                status: 'disponível',
                updatedAt: serverTimestamp()
            });
            if (selectedPet?.id === id) setSelectedPet(null);
        } catch (error) {
            console.error("Erro ao aprovar:", error);
            alert("Erro ao aprovar animal.");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Tem certeza que deseja rejeitar este cadastro? Isso irá apagar os dados.")) return;
        try {
            await deleteDoc(doc(db, 'pets', id));
            if (selectedPet?.id === id) setSelectedPet(null);
        } catch (error) {
            console.error("Erro ao rejeitar:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Candidatos a Adoção ({pendingPets.length})</h2>
                    <p className="text-sm text-gray-500">Analise e aprove os animais cadastrados por usuários.</p>
                </div>
            </div>

            {pendingPets.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700">Tudo limpo!</h3>
                    <p className="text-gray-400 mt-2">Não há novos pedidos de cadastro para análise no momento.</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Lista à Esquerda */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                        {pendingPets.map(pet => (
                            <Card
                                key={pet.id}
                                className={`p-4 transition-all cursor-pointer ${selectedPet?.id === pet.id ? 'border-brand-green ring-2 ring-brand-green/10' : 'hover:border-gray-200'}`}
                                onClick={() => setSelectedPet(pet)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                        <img src={pet.photos[0]} className="w-full h-full object-cover" alt={pet.name} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 text-lg">{pet.name}</h4>
                                            <Badge variant="warning" className="text-[10px] uppercase">{pet.species}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center"><Clock size={14} className="mr-1" /> {pet.age}</span>
                                            <span className="flex items-center"><MapPin size={14} className="mr-1" /> {pet.address?.split(',')[0]}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-green-50 text-green-600 hover:bg-green-100 border-none"
                                            onClick={(e) => { e.stopPropagation(); handleApprove(pet.id); }}
                                        >
                                            <Check size={18} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-none"
                                            onClick={(e) => { e.stopPropagation(); handleReject(pet.id); }}
                                        >
                                            <X size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Detalhes à Direita (Preview) */}
                    {selectedPet && (
                        <div className="hidden xl:block xl:col-span-5">
                            <Card className="sticky top-0 p-8 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                                <div className="aspect-video rounded-2xl overflow-hidden">
                                    <img src={selectedPet.photos[0]} className="w-full h-full object-cover" alt={selectedPet.name} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold text-gray-800">{selectedPet.name}</h3>
                                        <Badge variant="success">{selectedPet.gender}</Badge>
                                    </div>

                                    <p className="text-gray-600 text-sm leading-relaxed italic">
                                        "{selectedPet.description}"
                                    </p>

                                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <User size={16} className="text-brand-green mr-3" />
                                            <span><strong>Raça:</strong> {selectedPet.breed || 'SRD'}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone size={16} className="text-brand-green mr-3" />
                                            <span><strong>Contato:</strong> {selectedPet.contactPhone}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin size={16} className="text-brand-green mr-3" />
                                            <span><strong>Local:</strong> {selectedPet.address}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <Button
                                        variant="primary"
                                        className="flex-grow py-4"
                                        onClick={() => handleApprove(selectedPet.id)}
                                    >
                                        <Check size={20} className="mr-2" /> Aprovar Cadastro
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-red-500 border-red-200 hover:bg-red-50 py-4"
                                        onClick={() => handleReject(selectedPet.id)}
                                    >
                                        <Trash2 size={20} />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminApprovalPage;
