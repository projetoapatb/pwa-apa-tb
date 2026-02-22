import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Search,
    Stethoscope,
    Activity,
    Calendar,
    ChevronRight,
    Plus,
    X,
    AlertTriangle,
    ClipboardList,
    Download,
    Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Pet } from '../../types';

const recordSchema = z.object({
    petId: z.string().min(1, 'Selecione um animal'),
    petName: z.string().min(1, 'Nome do animal é obrigatório'),
    procedure: z.string().min(5, 'Procedimento deve ter pelo menos 5 caracteres'),
    vetName: z.string().min(3, 'Nome do veterinário obrigatório'),
    date: z.string().min(1, 'Data obrigatória'),
    type: z.enum(['consulta', 'vacina', 'cirurgia', 'exame']),
    status: z.enum(['agendado', 'concluido', 'cancelado']),
    notes: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface MedicalRecord {
    id: string;
    petId: string;
    petName: string;
    procedure: string;
    vetName: string;
    date: any;
    notes: string;
    status: 'agendado' | 'concluido' | 'cancelado';
    type: 'consulta' | 'vacina' | 'cirurgia' | 'exame';
    createdAt: any;
}

const MedicalRecordPage: React.FC = () => {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RecordFormData>({
        resolver: zodResolver(recordSchema),
        defaultValues: {
            type: 'consulta',
            status: 'agendado',
            date: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        const q = query(collection(db, 'medical_records'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MedicalRecord[];
            setRecords(list);
            setLoading(false);
        });

        const unsubPets = onSnapshot(collection(db, 'pets'), (snapshot) => {
            const petList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
            setPets(petList);
        });

        return () => {
            unsubscribe();
            unsubPets();
        };
    }, []);

    const onSubmit = async (data: RecordFormData) => {
        setSaving(true);
        try {
            await addDoc(collection(db, 'medical_records'), {
                ...data,
                date: new Date(data.date),
                createdAt: serverTimestamp(),
            });
            setIsModalOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar prontuário");
        } finally {
            setSaving(false);
        }
    };

    const deleteRecord = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este prontuário?")) return;
        try {
            await deleteDoc(doc(db, 'medical_records', id));
            setSelectedRecord(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir prontuário");
        }
    };

    const exportToCSV = () => {
        const headers = ['Data', 'Pet', 'Procedimento', 'Tipo', 'Veterinário', 'Status', 'Notas'];
        const csvData = filteredRecords.map(r => [
            r.date?.toDate ? r.date.toDate().toLocaleDateString('pt-BR') : '',
            r.petName,
            r.procedure,
            r.type,
            r.vetName,
            r.status,
            r.notes || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `prontuarios_apa_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const petId = e.target.value;
        const pet = pets.find(p => p.id === petId);
        if (pet) {
            setValue('petId', pet.id);
            setValue('petName', pet.name);
        }
    };

    const filteredRecords = records.filter(r =>
        r.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.procedure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vetName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative min-h-screen pb-20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between font-merriweather">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Prontuários Médicos</h2>
                    <p className="text-sm text-gray-400 font-medium">Histórico de saude e tratamentos dos animais.</p>
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
                        Novo Atendimento
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                <div className="relative flex-grow w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por animal, procedimento ou veterinário..."
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
            ) : filteredRecords.length === 0 ? (
                <Card className="p-20 text-center text-gray-400 border-2 border-dashed border-gray-100 italic bg-white/50 rounded-[2.5rem]">
                    <ClipboardList className="mx-auto mb-4 opacity-20" size={48} />
                    Nenhum prontuário médico registrado.
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRecords.map((record) => (
                        <button
                            key={record.id}
                            onClick={() => setSelectedRecord(record)}
                            className="w-full text-left"
                        >
                            <Card className="p-6 border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-6 group bg-white rounded-3xl cursor-pointer">
                                <div className="flex items-center gap-6 w-full">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${record.type === 'cirurgia' ? 'bg-red-50 text-red-500' :
                                        record.type === 'vacina' ? 'bg-blue-50 text-blue-500' :
                                            record.type === 'exame' ? 'bg-purple-50 text-purple-500' : 'bg-brand-green/10 text-brand-green'
                                        } shadow-inner`}>
                                        {record.type === 'vacina' ? <Activity size={28} /> :
                                            record.type === 'cirurgia' ? <AlertTriangle size={28} /> :
                                                <Stethoscope size={28} />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800 text-xl group-hover:text-brand-green transition-colors truncate">{record.petName}</h3>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter ${record.type === 'cirurgia' ? 'bg-red-100 text-red-600' :
                                                record.type === 'vacina' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-gray-100 text-gray-400'
                                                }`}>
                                                {record.type}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-500 mb-2">{record.procedure}</p>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
                                            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100/50">
                                                <Calendar size={14} className="text-gray-300" />
                                                {record.date?.toDate ? record.date.toDate().toLocaleDateString('pt-BR') : 'Sem data'}
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1">
                                                <ClipboardList size={14} className="text-brand-acqua" />
                                                Dr(a). {record.vetName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-sm ${record.status === 'agendado' ? 'bg-yellow-100 text-yellow-700' :
                                        record.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {record.status}
                                    </span>
                                    <div className="text-gray-200 group-hover:text-brand-green transition-colors">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </Card>
                        </button>
                    ))}
                </div>
            )}

            {/* Modal de Detalhes do Prontuário */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl p-8 animate-scale-in border-none shadow-2xl rounded-[2.5rem] bg-white text-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black font-merriweather">Detalhes do Atendimento</h2>
                            <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Animal</p>
                                    <p className="text-2xl font-black text-brand-green">{selectedRecord.petName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Procedimento</p>
                                    <p className="text-xl font-bold">{selectedRecord.procedure}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 py-6 border-y border-gray-50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo</p>
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedRecord.type}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <span className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedRecord.status}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</p>
                                    <p className="font-bold">{selectedRecord.date?.toDate().toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Veterinário Responsável</p>
                                <p className="font-bold flex items-center gap-2">
                                    <Stethoscope size={16} className="text-brand-acqua" />
                                    Dr(a). {selectedRecord.vetName}
                                </p>
                            </div>

                            {selectedRecord.notes && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observações e Notas</p>
                                    <div className="p-4 bg-gray-50 rounded-2xl italic text-gray-600 leading-relaxed shadow-inner">
                                        {selectedRecord.notes}
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 flex gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-grow border-red-100 text-red-500 hover:bg-red-50 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
                                    onClick={() => deleteRecord(selectedRecord.id)}
                                >
                                    <Trash2 size={20} />
                                    Excluir Registro
                                </Button>
                                <Button
                                    className="flex-grow py-4 rounded-2xl font-bold"
                                    onClick={() => setSelectedRecord(null)}
                                >
                                    Fechar Detalhes
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Novo Atendimento */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-8 animate-scale-in border-none shadow-2xl rounded-[2.5rem] bg-white text-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-merriweather">Novo Atendimento 🩺</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Selecionar Animal</label>
                                <select
                                    onChange={handlePetChange}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-bold bg-white"
                                >
                                    <option value="">Selecione um Pet...</option>
                                    {pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                                    ))}
                                </select>
                                {errors.petId && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.petId.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Procedimento</label>
                                    <input
                                        {...register('procedure')}
                                        placeholder="Ex: Vacina V10"
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                    />
                                    {errors.procedure && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.procedure.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Tipo</label>
                                    <select
                                        {...register('type')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-bold bg-white"
                                    >
                                        <option value="consulta">Consulta</option>
                                        <option value="vacina">Vacina</option>
                                        <option value="cirurgia">Cirurgia</option>
                                        <option value="exame">Exame</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Data</label>
                                    <input
                                        type="date"
                                        {...register('date')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Status</label>
                                    <select
                                        {...register('status')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-bold bg-white"
                                    >
                                        <option value="agendado">Agendado</option>
                                        <option value="concluido">Concluído</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Veterinário Responsável</label>
                                <input
                                    {...register('vetName')}
                                    placeholder="Ex: Dr. Silva"
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                />
                                {errors.vetName && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{errors.vetName.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Observações (Opcional)</label>
                                <textarea
                                    {...register('notes')}
                                    placeholder="Detalhes do tratamento, remédios prescritos, etc."
                                    rows={3}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-brand-green transition-all outline-none font-medium"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-brand-green/20"
                                >
                                    Gravar no Prontuário
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MedicalRecordPage;
