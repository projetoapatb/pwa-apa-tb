import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Download,
    Trash2,
    MessageSquare,
    Phone,
    Mail,
    User,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    RotateCcw
} from 'lucide-react';
import type { LeadAdoption } from '../../types';

const PetInfo: React.FC<{ petId: string }> = ({ petId }) => {
    const [pet, setPet] = useState<{ name: string; photo: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId) return;
        const fetchPet = async () => {
            try {
                const petDoc = await getDocs(query(collection(db, 'pets')));
                const found = petDoc.docs.find((d: any) => d.id === petId);
                if (found) {
                    const data = found.data();
                    setPet({
                        name: data.name,
                        photo: data.photos?.[0] || ''
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar pet:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPet();
    }, [petId]);

    if (loading) return <span className="text-[10px] text-gray-400">Carregando...</span>;
    if (!pet) return <span className="text-[10px] text-red-300 italic">Pet não encontrado</span>;

    return (
        <div className="flex items-center gap-3 mt-1 py-1">
            {pet.photo && (
                <img
                    src={pet.photo}
                    alt={pet.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                />
            )}
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Interesse em:</p>
                <p className="text-sm font-bold text-brand-green">{pet.name}</p>
            </div>
        </div>
    );
};

const LeadManagementPage: React.FC = () => {
    const [leads, setLeads] = useState<LeadAdoption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'leads_adoption'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LeadAdoption[];
            setLeads(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Excluir o lead de ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'leads_adoption', id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending' | 'contacted', reason?: string) => {
        try {
            const data: any = {
                status,
                updatedAt: serverTimestamp()
            };
            if (reason) data.rejectionReason = reason;

            await updateDoc(doc(db, 'leads_adoption', id), data);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Motivo da recusa (será exibido para o usuário):");
        if (reason) {
            await updateStatus(id, 'rejected', reason);
        }
    };

    const exportToCSV = () => {
        if (leads.length === 0) return;

        const headers = ['Data', 'Nome', 'Email', 'Telefone', 'Pet ID', 'Mensagem', 'Status', 'Motivo Rejeição'];
        const rows = leads.map(l => [
            l.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '',
            l.name,
            l.email,
            l.phone,
            l.petId || (l as any).dogId || '',
            l.message?.replace(/,/g, ';') || '',
            l.status || 'pending',
            l.rejectionReason || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_adocao_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Carregando interessados...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Atendimento</p>
                    <h2 className="text-2xl font-bold text-gray-800">Leads de Adoção</h2>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="gap-2 border-brand-green text-brand-green hover:bg-green-50">
                    <Download size={20} /> Exportar CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {leads.map((l) => (
                    <Card key={l.id} className={`p-6 border-2 transition-all ${l.status === 'contacted' ? 'border-transparent bg-gray-50/50 opacity-80' : 'border-brand-acqua/20 shadow-sm'}`}>
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">

                            <div className="space-y-4 flex-grow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-acqua/10 text-brand-acqua flex items-center justify-center">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 leading-tight">{l.name}</h3>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar size={12} /> {l.createdAt?.toDate?.()?.toLocaleString('pt-BR') || '---'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant={
                                            l.status === 'approved' ? 'success' :
                                                l.status === 'rejected' ? 'warning' :
                                                    l.status === 'contacted' ? 'success' : 'info'
                                        } className="uppercase text-[9px]">
                                            {l.status === 'approved' ? 'Aprovado ✨' :
                                                l.status === 'rejected' ? 'Recusado ❌' :
                                                    l.status === 'contacted' ? 'Contatado' : 'Pendente'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <a href={`mailto:${l.email}`} className="flex items-center gap-2 hover:text-brand-green transition">
                                        <Mail size={16} className="text-gray-400" /> {l.email}
                                    </a>
                                    <a href={`tel:${l.phone}`} className="flex items-center gap-2 hover:text-brand-green transition">
                                        <Phone size={16} className="text-gray-400" /> {l.phone}
                                    </a>
                                </div>

                                {l.message && (
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 relative">
                                        <MessageSquare size={14} className="absolute -top-2 -left-2 text-brand-orange" />
                                        <p className="text-sm text-gray-600 italic">"{l.message}"</p>
                                    </div>
                                )}

                                {l.rejectionReason && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 italic">
                                        <span className="font-bold">Motivo da recusa:</span> {l.rejectionReason}
                                    </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-gray-50">
                                    <PetInfo petId={l.petId || (l as any).dogId} />
                                </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto h-full justify-between lg:justify-start">
                                {l.status === 'pending' || l.status === 'contacted' ? (
                                    <>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="bg-brand-green hover:bg-green-600 text-white rounded-xl h-12 shadow-lg shadow-green-900/10 flex-grow lg:flex-none gap-2"
                                            onClick={() => updateStatus(l.id, 'approved')}
                                        >
                                            <CheckCircle2 size={16} /> Aprovar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-200 text-red-400 hover:bg-red-50 rounded-xl h-12 flex-grow lg:flex-none gap-2"
                                            onClick={() => handleReject(l.id)}
                                        >
                                            <XCircle size={16} /> Recusar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`rounded-xl h-12 flex-grow lg:flex-none gap-2 ${l.status === 'contacted' ? 'bg-brand-acqua/10 border-brand-acqua text-brand-acqua' : 'border-gray-200 text-gray-400'}`}
                                            onClick={() => updateStatus(l.id, l.status === 'contacted' ? 'pending' : 'contacted')}
                                        >
                                            {l.status === 'contacted' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                                            {l.status === 'contacted' ? 'Pendente' : 'Marcar Contatado'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-200 text-gray-400 hover:bg-gray-50 rounded-xl h-12 flex-grow lg:flex-none gap-2"
                                        onClick={() => updateStatus(l.id, 'pending')}
                                    >
                                        <RotateCcw size={16} /> Reabrir Análise
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-2 h-12 w-12 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                                    onClick={() => handleDelete(l.id, l.name)}
                                >
                                    <Trash2 size={20} />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {leads.length === 0 && (
                <div className="text-center p-20 border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-gray-400 font-medium">Nenhum interessado registrado ainda.</p>
                </div>
            )}
        </div>
    );
};

export default LeadManagementPage;
