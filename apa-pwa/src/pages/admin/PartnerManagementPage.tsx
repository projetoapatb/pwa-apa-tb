import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import type { Partner } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Plus,
    Edit2,
    Trash2,
    ExternalLink,
    Eye,
    EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PartnerManagementPage: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'partners'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Partner[];
            setPartners(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Excluir o parceiro ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'partners', id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const toggleStatus = async (partner: Partner) => {
        try {
            await updateDoc(doc(db, 'partners', partner.id), {
                isActive: !partner.isActive
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="p-20 text-center animate-pulse">Carregando parceiros...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Institucional</p>
                    <h2 className="text-2xl font-bold text-gray-800">Parceiros da ONG</h2>
                </div>
                <Link to="/admin/parceiros/novo">
                    <Button className="gap-2">
                        <Plus size={20} /> Novo Parceiro
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map((p) => (
                    <Card key={p.id} className={`p-6 border-2 transition-all group ${p.isActive ? 'border-transparent shadow-sm' : 'border-dashed border-gray-200 opacity-60'}`}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center p-2">
                                <img src={p.logo} alt={p.name} className="max-w-full max-h-full object-contain" />
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                                {p.website && (
                                    <a href={p.website} target="_blank" rel="noreferrer" className="text-xs text-brand-acqua hover:underline flex items-center justify-center gap-1 mt-1">
                                        Website <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Link to={`/admin/parceiros/editar/${p.id}`}>
                                    <Button variant="outline" size="sm" className="p-2 rounded-xl">
                                        <Edit2 size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-2 rounded-xl"
                                    onClick={() => toggleStatus(p)}
                                >
                                    {p.isActive ? <Eye size={16} /> : <EyeOff size={16} className="text-red-400" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-2 rounded-xl hover:bg-red-50 hover:border-red-200"
                                    onClick={() => handleDelete(p.id, p.name)}
                                >
                                    <Trash2 size={16} className="text-red-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4">
                            <Badge variant={p.isActive ? 'success' : 'info'} className="text-[10px] uppercase">
                                {p.isActive ? 'Ativo' : 'Oculto'}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>

            {partners.length === 0 && (
                <div className="text-center p-20 border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-gray-400">Nenhum parceiro cadastrado ainda.</p>
                </div>
            )}
        </div>
    );
};

export default PartnerManagementPage;
