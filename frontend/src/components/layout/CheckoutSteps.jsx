import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 'cart', label: 'Cart', path: '/cart' },
  { key: 'checkout', label: 'Address & Age', path: '/checkout' },
  { key: 'done', label: 'Done', path: null },
];

export default function CheckoutSteps({ current = 'checkout' }) {
  const idx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav className="flex items-center gap-2 mb-6 text-sm">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        const content = (
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm ${
              active ? 'bg-flipkart-blue text-white font-medium' :
              done ? 'text-flipkart-green' : 'text-flipkart-muted'
            }`}
          >
            {done ? <Check size={14} /> : <span className="w-4 text-center">{i + 1}</span>}
            {step.label}
          </span>
        );
        return (
          <div key={step.key} className="flex items-center gap-2">
            {step.path && !active ? <Link to={step.path}>{content}</Link> : content}
            {i < STEPS.length - 1 && <span className="text-gray-300">›</span>}
          </div>
        );
      })}
    </nav>
  );
}
