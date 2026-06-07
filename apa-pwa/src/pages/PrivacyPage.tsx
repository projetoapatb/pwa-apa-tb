import React from 'react';
import SEO from '../components/SEO';
import { ShieldCheck, Mail } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <SEO
        title="Política de Privacidade | APA Telêmaco Borba"
        description="Saiba como a APA Telêmaco Borba coleta, utiliza e protege seus dados pessoais."
      />

      <div className="bg-brand-green text-white py-16 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <ShieldCheck size={40} className="mx-auto mb-4 text-brand-acqua" />
          <h1 className="text-3xl md:text-4xl font-bold font-merriweather mb-4">
            Política de Privacidade
          </h1>
          <p className="text-green-100 text-sm max-w-xl mx-auto leading-relaxed">
            Transparência sobre como tratamos as informações que você compartilha conosco.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 -mt-8">
        <article className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
          <p className="text-sm text-gray-400">
            Última atualização: junho de 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Quem somos</h2>
            <p>
              Esta política descreve como a <strong>APA Telêmaco Borba</strong> (Associação de Proteção aos Animais de Telêmaco Borba) trata dados pessoais coletados por meio deste site e dos formulários disponíveis na plataforma.
            </p>
            <p className="text-sm italic text-gray-500">
              Este documento tem caráter informativo e não substitui orientação jurídica especializada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Quais dados coletamos</h2>
            <p>Dependendo do serviço utilizado, podemos coletar:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Nome e e-mail (cadastro e login);</li>
              <li>Telefone e endereço (contato e perfil residencial);</li>
              <li>Informações sobre interesse em adoção, voluntariado ou lar temporário;</li>
              <li>Dados de anúncios de pets para adoção ou do mural de perdidos (descrição, local, fotos e contato);</li>
              <li>Mensagens opcionais enviadas nos formulários.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Por que coletamos</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Atender solicitações de adoção, voluntariado e lar temporário;</li>
              <li>Entrar em contato sobre processos de adoção ou cadastros pendentes;</li>
              <li>Publicar e moderar anúncios no mural de pets perdidos;</li>
              <li>Gerenciar cadastros e a rotina interna da ONG;</li>
              <li>Manter sua conta e preferências no site.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Como usamos e compartilhamos</h2>
            <p>
              Os dados são acessados por voluntários e administradores autorizados da APA para fins relacionados às atividades da organização. Não vendemos seus dados pessoais.
            </p>
            <p>
              Informações de contato em anúncios públicos (como telefone no mural de perdidos) podem ficar visíveis a outros visitantes do site, conforme o propósito do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em serviços de nuvem utilizados pela plataforma. Adotamos medidas técnicas e organizacionais para reduzir riscos de acesso não autorizado, perda ou uso indevido, dentro das possibilidades de uma organização sem fins lucrativos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Seus direitos</h2>
            <p>
              Você pode solicitar a correção ou exclusão dos seus dados pessoais, bem como esclarecimentos sobre o tratamento realizado pela APA. Para isso, entre em contato conosco pelo canal indicado abaixo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 font-merriweather">Contato</h2>
            <div className="flex items-start gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <Mail size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-gray-800 mb-1">APA Telêmaco Borba</p>
                <p>
                  E-mail para privacidade e dados pessoais:{' '}
                  <span className="text-brand-green font-medium">[definir e-mail oficial da APA]</span>
                </p>
                <p className="text-gray-400 mt-2 text-xs">
                  A organização deve informar aqui o endereço de e-mail ou outro canal oficial de atendimento.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};

export default PrivacyPage;
