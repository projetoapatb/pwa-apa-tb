import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Download,
    Trash2,
    MessageSquare,
    Calendar,
    CheckCircle2,
    Clock,
    Briefcase,
    XCircle,
    RotateCcw,
    User,
    Mail,
    Phone
} from 'lucide-react';

const VolunteerManagementPage: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'leads_volunteer'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLeads(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'leads_volunteer', id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Motivo da reprovação (será exibido para o usuário):");
        if (reason) {
            try {
                await updateDoc(doc(db, 'leads_volunteer', id), {
                    status: 'rejected',
                    rejectionReason: reason,
                    updatedAt: serverTimestamp()
                });
            } catch (error) {
                console.error(error);
                alert("Erro ao reprovar.");
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Excluir o registro de voluntariado de ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'leads_volunteer', id));
            } catch (error) {
                console.error(error);
            }
        }
    };


    const exportToCSV = () => {
        if (leads.length === 0) return;

        const headers = ['Data', 'Nome', 'Email', 'Telefone', 'Área', 'Mensagem', 'Status'];
        const rows = leads.map(l => [
            l.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '',
            l.name,
            l.email,
            l.phone,
            l.area,
            (l.message || '').replace(/,/g, ';'),
            l.status || 'pending'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `voluntarios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Carregando voluntários...</div>;

    const getAreaLabel = (area: string) => {
        const areas: Record<string, string> = {
            limpeza: 'Limpeza',
            eventos: 'Eventos',
            passeios: 'Passeios',
            lar_temporario: 'Lar Temporário',
            outros: 'Outros'
        };
        return areas[area] || area;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Captação</p>
                    <h2 className="text-2xl font-bold text-gray-800">Candidatos a Voluntário</h2>
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
                                    <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
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

                                <div className="flex items-center gap-2">
                                    <Badge variant="warning" className="gap-1.5 py-1.5 px-3">
                                        <Briefcase size={12} />
                                        {getAreaLabel(l.area)}
                                    </Badge>
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
                                            className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl h-12 flex-grow lg:flex-none gap-2"
                                            onClick={() => handleReject(l.id)}
                                        >
                                            <XCircle size={16} /> Reprovar
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
                    <p className="text-gray-400 font-medium">Nenhum candidato a voluntário registrado ainda.</p>
                </div>
            )}
        </div>
    );
};

export default VolunteerManagementPage;
