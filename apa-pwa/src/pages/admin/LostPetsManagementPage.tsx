import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import {
    Search,
    Trash2,
    CheckCircle,
    MapPin,
    Phone,
    XCircle,
    Clock,
    CheckSquare,
    Heart
} from 'lucide-react';
import StorySuccessModal from '../../components/admin/StorySuccessModal';
import { addDoc } from 'firebase/firestore';

interface LostPet {
    id: string;
    name: string;
    species: string;
    description: string;
    lastSeenLocation: string;
    lastSeenDate: any;
    contactPhone: string;
    photoUrl: string;
    status: 'perdido' | 'encontrado';
    moderationStatus: 'pending' | 'approved' | 'rejected';
    userId: string;
    createdAt: any;
}

const LostPetsManagementPage: React.FC = () => {
    const [pets, setPets] = useState<LostPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedPet, setSelectedPet] = useState<LostPet | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'lost_pets'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const petList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LostPet[];
            setPets(petList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateModerationStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'lost_pets', id), {
                moderationStatus: status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Erro ao atualizar moderação:", error);
            alert("Erro ao atualizar moderação.");
        }
    };

    const toggleStatus = async (pet: LostPet) => {
        const newStatus = pet.status === 'perdido' ? 'encontrado' : 'perdido';
        try {
            await updateDoc(doc(db, 'lost_pets', pet.id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            if (newStatus === 'encontrado') {
                setSelectedPet(pet);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleCreateStory = async (storyData: { title: string; content: string }) => {
        if (!selectedPet) return;

        try {
            await addDoc(collection(db, 'posts'), {
                title: storyData.title,
                content: storyData.content,
                excerpt: storyData.content.substring(0, 100) + '...',
                image: selectedPet.photoUrl,
                category: 'história',
                publishDate: serverTimestamp(),
                author: 'Sistema APA',
                isActive: true,
                isHighlighted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            alert("História de final feliz publicada com sucesso!");
        } catch (error) {
            console.error("Erro ao criar história:", error);
            alert("Erro ao criar história.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja remover este anúncio permanentemente?")) return;
        try {
            await deleteDoc(doc(db, 'lost_pets', id));
        } catch (error) {
            console.error("Erro ao deletar anúncio:", error);
            alert("Erro ao deletar anúncio.");
        }
    };

    const filteredPets = pets
        .filter(p => !p.moderationStatus || p.moderationStatus === activeTab || (activeTab === 'pending' && !p.moderationStatus))
        .filter(pet =>
            pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.lastSeenLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const counts = {
        pending: pets.filter(p => !p.moderationStatus || p.moderationStatus === 'pending').length,
        approved: pets.filter(p => p.moderationStatus === 'approved').length,
        rejected: pets.filter(p => p.moderationStatus === 'rejected').length
    };

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex bg-white/50 p-2 rounded-[2rem] w-fit shadow-sm border border-gray-100">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'pending' ? 'bg-brand-green text-white shadow-xl shadow-green-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={14} />
                    Pendentes ({counts.pending})
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'approved' ? 'bg-green-600 text-white shadow-xl shadow-green-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <CheckSquare size={14} />
                    Aprovados ({counts.approved})
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'rejected' ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <XCircle size={14} />
                    Reprovados ({counts.rejected})
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="relative flex-grow w-full max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar registros..."
                        className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-brand-green outline-none bg-white shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-21">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green"></div>
                </div>
            ) : filteredPets.length === 0 ? (
                <Card className="p-21 text-center text-gray-300 border-dashed bg-gray-50/30 rounded-[2.5rem]">
                    Nenhum registro encontrado nesta aba.
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredPets.map((pet) => (
                        <Card key={pet.id} className="p-8 flex gap-8 items-start border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white rounded-[2.5rem]">
                            <img
                                src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300'}
                                alt={pet.name}
                                className="w-34 h-34 rounded-[2rem] object-cover flex-shrink-0 shadow-lg"
                            />
                            <div className="flex-grow min-w-0 py-2">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800 truncate mb-1">{pet.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-green">{pet.species}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${pet.status === 'perdido' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        {pet.status}
                                    </span>
                                </div>
                                <div className="space-y-3 text-xs text-gray-500 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <MapPin size={14} className="text-brand-green" />
                                        </div>
                                        <span className="truncate">{pet.lastSeenLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <Phone size={14} className="text-brand-green" />
                                        </div>
                                        <span className="font-bold">{pet.contactPhone}</span>
                                    </div>
                                </div>

                                {activeTab === 'pending' ? (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => updateModerationStatus(pet.id, 'approved')}
                                            className="flex-grow py-4 bg-green-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle size={16} /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => updateModerationStatus(pet.id, 'rejected')}
                                            className="px-6 py-4 bg-red-50 text-red-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => toggleStatus(pet)}
                                            className={`flex-grow py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${pet.status === 'perdido' ? 'bg-brand-green text-white shadow-lg shadow-green-900/10 hover:bg-green-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {pet.status === 'perdido' ? <Heart size={16} /> : null}
                                            MARCAR {pet.status === 'perdido' ? 'ENCONTRADO' : 'PERDIDO'}
                                        </button>
                                        {activeTab === 'rejected' && (
                                            <button
                                                onClick={() => updateModerationStatus(pet.id, 'approved')}
                                                className="p-4 bg-green-50 text-green-600 rounded-[1.25rem] hover:bg-green-100 transition-all"
                                                title="Mover para aprovados"
                                            >
                                                <CheckSquare size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(pet.id)}
                                            className="p-4 bg-red-50 text-red-500 rounded-[1.25rem] hover:bg-red-100 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {selectedPet && (
                <StorySuccessModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleCreateStory}
                    petName={selectedPet.name}
                />
            )}
        </div>
    );
};

export default LostPetsManagementPage;
