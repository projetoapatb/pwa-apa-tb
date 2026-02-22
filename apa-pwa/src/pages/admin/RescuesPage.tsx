import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Search,
    MapPin,
    Plus,
    Clock,
    X,
    AlertTriangle,
    CheckCircle2,
    Info,
    Download,
    Trash2,
    History
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const rescueSchema = z.object({
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    location: z.string().min(5, 'Localização obrigatória'),
    urgency: z.enum(['baixa', 'media', 'alta', 'critica']),
    contactInfo: z.string().min(5, 'Informação de contato obrigatória'),
});

type RescueFormData = z.infer<typeof rescueSchema>;

interface Rescue {
    id: string;
    description: string;
    location: string;
    status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
    urgency: 'baixa' | 'media' | 'alta' | 'critica';
    contactInfo: string;
    createdAt: any;
    updatedAt: any;
}

const RescuesPage: React.FC = () => {
    const [rescues, setRescues] = useState<Rescue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRescue, setSelectedRescue] = useState<Rescue | null>(null);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<RescueFormData>({
        resolver: zodResolver(rescueSchema),
        defaultValues: {
            urgency: 'media'
        }
    });

    useEffect(() => {
        const q = query(collection(db, 'rescues'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rescueList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Rescue[];
            setRescues(rescueList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: RescueFormData) => {
        setSaving(true);
        try {
            await addDoc(collection(db, 'rescues'), {
                ...data,
                status: 'pendente',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setIsModalOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar ocorrência");
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'rescues', id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            if (selectedRescue?.id === id) {
                setSelectedRescue({ ...selectedRescue, status: newStatus as any });
            }
        } catch (error) {
            console.error("Erro ao atualizar resgate:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const deleteRescue = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este registro de resgate?")) return;
        try {
            await deleteDoc(doc(db, 'rescues', id));
            setSelectedRescue(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir resgate");
        }
    };

    const exportToCSV = () => {
        const headers = ['Data', 'Descrição', 'Localização', 'Urgência', 'Status', 'Contato'];
        const csvData = filteredRescues.map(r => [
            r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('pt-BR') : '',
            r.description,
            r.location,
            r.urgency,
            r.status,
            r.contactInfo
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `resgates_apa_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredRescues = rescues.filter(r =>
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative min-h-screen pb-20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between font-merriweather">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Gestão de Resgates</h2>
                    <p className="text-sm text-gray-400 font-medium">Controle de ocorrências e resgates em andamento.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="flex-grow md:flex-initial px-6 py-3 rounded-2xl flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold"
                        onClick={exportToCSV}
                    >
                        <Download size={20} />
                        Exportar CSV
                    </Button>
                    <Button
                        variant="orange"
                        className="flex-grow md:flex-initial px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-orange/20 font-bold"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={20} />
                        Registrar Ocorrência
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                <div className="relative flex-grow w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar resgates e ocorrências..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-green/20 outline-none text-gray-700 font-medium bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
                </div>
            ) : filteredRescues.length === 0 ? (
                <Card className="p-20 text-center text-gray-400 border-2 border-dashed border-gray-100 italic bg-white/50 rounded-[2.5rem]">
                    <AlertTriangle className="mx-auto mb-4 opacity-20" size={48} />
                    Nenhuma ocorrência registrada que combine com sua busca.
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRescues.map((rescue) => (
                        <button
                            key={rescue.id}
                            onClick={() => setSelectedRescue(rescue)}
                            className="w-full text-left"
                        >
                            <Card className="p-6 border-none shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-white group rounded-3xl cursor-pointer">
                                <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${rescue.urgency === 'critica' ? 'bg-red-500' :
                                        rescue.urgency === 'alta' ? 'bg-orange-500' :
                                            rescue.urgency === 'media' ? 'bg-yellow-400' : 'bg-blue-400'
                                    }`} />

                                <div className="flex flex-col md:flex-row justify-between gap-6 pl-2">
                                    <div className="space-y-4 flex-grow max-w-2xl">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${rescue.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                                    rescue.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                                                        rescue.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {rescue.status.replace('_', ' ')}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest bg-gray-50 text-gray-400 border border-gray-100`}>
                                                Urgência {rescue.urgency}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-800 leading-tight group-hover:text-brand-green transition-colors">{rescue.description}</h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
                                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100/50">
                                                <MapPin size={16} className="text-brand-green" />
                                                <span className="truncate">{rescue.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 px-4 py-2">
                                                <Clock size={16} className="text-brand-acqua" />
                                                <span>{rescue.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-2 justify-end items-center md:items-stretch">
                                        {rescue.status === 'pendente' && (
                                            <Button
                                                size="sm"
                                                className="bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/10 py-3 rounded-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(rescue.id, 'em_andamento');
                                                }}
                                            >
                                                Atender
                                            </Button>
                                        )}
                                        {rescue.status === 'em_andamento' && (
                                            <Button
                                                size="sm"
                                                className="bg-brand-green hover:bg-green-700 shadow-md shadow-brand-green/10 py-3 rounded-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(rescue.id, 'concluido');
                                                }}
                                            >
                                                Finalizar
                                            </Button>
                                        )}
                                        <div className="text-gray-200 group-hover:text-brand-green transition-colors px-2">
                                            <ChevronRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </button>
                    ))}
                </div>
            )}

            {/* Modal de Detalhes do Resgate */}
            {selectedRescue && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl p-8 animate-scale-in border-none shadow-2xl rounded-[2.5rem] bg-white text-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black font-merriweather">Detalhes da Ocorrência</h2>
                            <button onClick={() => setSelectedRescue(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest ${selectedRescue.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                        selectedRescue.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                                            selectedRescue.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {selectedRescue.status.replace('_', ' ')}
                                </span>
                                <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest bg-gray-100 text-gray-600`}>
                                    Urgência {selectedRescue.urgency}
                                </span>
                            </div>

                            <div className="py-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</p>
                                <p className="text-2xl font-bold leading-tight text-gray-800">{selectedRescue.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Localização</p>
                                        <div className="flex items-center gap-2 font-bold text-gray-700">
                                            <MapPin size={18} className="text-brand-green" />
                                            {selectedRescue.location}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Solicitante / Contato</p>
                                        <div className="flex items-center gap-2 font-bold text-gray-700">
                                            <Info size={18} className="text-brand-orange" />
                                            {selectedRescue.contactInfo}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data de Abertura</p>
                                        <div className="flex items-center gap-2 font-bold text-gray-700">
                                            <Clock size={18} className="text-brand-acqua" />
                                            {selectedRescue.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Última Atualização</p>
                                        <div className="flex items-center gap-2 font-bold text-gray-700">
                                            <History size={18} className="text-gray-400" />
                                            {selectedRescue.updatedAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <div className="flex gap-4 flex-grow">
                                    {selectedRescue.status === 'pendente' && (
                                        <Button
                                            className="flex-grow bg-blue-500 hover:bg-blue-600 py-4 rounded-2xl font-bold"
                                            onClick={() => updateStatus(selectedRescue.id, 'em_andamento')}
                                        >
                                            Iniciar Atendimento
                                        </Button>
                                    )}
                                    {selectedRescue.status === 'em_andamento' && (
                                        <Button
                                            className="flex-grow bg-brand-green hover:bg-green-700 py-4 rounded-2xl font-bold"
                                            onClick={() => updateStatus(selectedRescue.id, 'concluido')}
                                        >
                                            Concluir Resgate
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="flex-grow border-red-100 text-red-500 hover:bg-red-50 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                                        onClick={() => deleteRescue(selectedRescue.id)}
                                    >
                                        <Trash2 size={20} />
                                        Excluir
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="bg-gray-100 text-gray-600 py-4 px-8 rounded-2xl font-bold"
                                    onClick={() => setSelectedRescue(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Nova Ocorrência */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-8 animate-scale-in border-none shadow-2xl rounded-[2.5rem] bg-white text-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-merriweather">Nova Ocorrência 🚑</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Descrição do Resgate</label>
                                <textarea
                                    {...register('description')}
                                    placeholder="Ex: Cão atropelado na BR, precisa de atendimento urgente."
                                    rows={3}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium placeholder:text-gray-200"
                                />
                                {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.description.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Localização</label>
                                    <input
                                        {...register('location')}
                                        placeholder="Ex: Bairro Centro, Rua 12"
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                    />
                                    {errors.location && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.location.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Urgência</label>
                                    <select
                                        {...register('urgency')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-bold bg-white"
                                    >
                                        <option value="baixa">Baixa</option>
                                        <option value="media">Média</option>
                                        <option value="alta">Alta</option>
                                        <option value="critica">Crítica 🚨</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Contato do Solicitante</label>
                                <input
                                    {...register('contactInfo')}
                                    placeholder="Ex: Nome + Telefone"
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                />
                                {errors.contactInfo && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.contactInfo.message}</p>}
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-brand-green/20"
                                >
                                    Abrir Chamado de Resgate
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default RescuesPage;
