import { Link } from 'react-router-dom';

interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  error?: string;
}

export const PrivacyConsentCheckbox = ({
  checked,
  onChange,
  id = 'privacyConsent',
  error,
}: PrivacyConsentCheckboxProps) => (
  <div className="space-y-1">
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer text-sm text-gray-600 leading-relaxed">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-brand-green focus:ring-brand-green flex-shrink-0"
      />
      <span>
        Li e concordo com a{' '}
        <Link to="/privacidade" className="text-brand-green font-bold hover:underline">
          Política de Privacidade
        </Link>{' '}
        e autorizo o uso dos meus dados para o atendimento desta solicitação.
      </span>
    </label>
    {error && <p className="text-xs text-red-500 ml-8">{error}</p>}
  </div>
);
