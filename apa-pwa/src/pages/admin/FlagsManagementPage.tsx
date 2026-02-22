import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Settings,
    Zap,
    ZapOff,
    Heart,
    Gift,
    Search,
    Users,
    Newspaper,
    HandHelping,
    AlertTriangle,
    Save
} from 'lucide-react';

const defaultFlags = {
    adoption: true,
    donations: true,
    lostPets: true,
    partners: true,
    stories: true,
    volunteers: true
};

const FlagsManagementPage: React.FC = () => {
    const [flags, setFlags] = useState<any>(defaultFlags);
    const [originalFlags, setOriginalFlags] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'flags', 'global'), (snap) => {
            if (snap.exists()) {
                setFlags(snap.data());
                setOriginalFlags(snap.data());
            } else {
                setFlags(defaultFlags);
                setOriginalFlags(null); // Indica que ainda não existe no banco
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleToggle = (key: string) => {
        setFlags((prev: any) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'flags', 'global'), flags);
            alert("Configurações aplicadas com sucesso! 🎉");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar flags");
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = JSON.stringify(flags) !== JSON.stringify(originalFlags);

    if (loading) return <div className="p-20 text-center animate-pulse">Carregando permissões...</div>;

    const flagConfig = [
        { key: 'adoption', label: 'Módulo de Adoção', icon: Heart, description: 'Exibe a galeria de animais e formulário de interesse.' },
        { key: 'donations', label: 'Doações', icon: Gift, description: 'Mostra a chave PIX e lista de itens prioritários.' },
        { key: 'lostPets', label: 'Achados e Perdidos', icon: Search, description: 'Habilita a seção de utilidade pública.' },
        { key: 'partners', label: 'Parceiros', icon: Users, description: 'Exibe logotipos de empresas apoiadoras na Home.' },
        { key: 'stories', label: 'Histórias / Notícias', icon: Newspaper, description: 'Mostra o blog e resultados de eventos.' },
        { key: 'volunteers', label: 'Voluntariado', icon: HandHelping, description: 'Habilita página de inscrição para lar temporário.' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Controles de Visibilidade</h2>
                        <p className="text-xs text-gray-400 font-medium">Ligue ou desligue seções inteiras do site instantaneamente.</p>
                    </div>
                </div>
                {hasChanges && (
                    <Button onClick={handleSave} isLoading={saving} className="gap-2 shadow-lg shadow-brand-green/20">
                        <Save size={18} /> Aplicar Alterações
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {flagConfig.map((item) => (
                    <Card
                        key={item.key}
                        className={`p-6 border-2 transition-all cursor-pointer select-none group ${flags[item.key] ? 'border-brand-green/20 bg-white' : 'border-gray-100 bg-gray-50/50 grayscale opacity-60'}`}
                        onClick={() => handleToggle(item.key)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl transition-colors ${flags[item.key] ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-200 text-gray-400'}`}>
                                <item.icon size={24} />
                            </div>
                            <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${flags[item.key] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                {flags[item.key] ? 'Ativado' : 'Inativo'}
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 text-lg mb-1">{item.label}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                            {item.description}
                        </p>

                        <div className="mt-6 flex items-center justify-between pointer-events-none">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${flags[item.key] ? 'bg-brand-green' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${flags[item.key] ? 'right-1' : 'left-1'}`} />
                            </div>
                            {flags[item.key] ? <Zap size={14} className="text-brand-orange animate-pulse" /> : <ZapOff size={14} className="text-gray-400" />}
                        </div>
                    </Card>
                ))}
            </div>

            {!flags && !loading && (
                <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl text-center space-y-4">
                    <AlertTriangle size={40} className="mx-auto text-brand-orange" />
                    <h3 className="font-bold text-gray-800">Caminho de Configuração não encontrado</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        A coleção <code className="bg-orange-100 px-1 rounded">config/flags</code> ainda não foi criada no seu Firestore. Você precisará criá-la com as chaves booleanas para habilitar este painel.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FlagsManagementPage;
