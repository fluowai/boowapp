import React from 'react';
import useApi from '../hooks/useApi';
import { Plan, User } from '../types';

const PlanCard: React.FC<{ plan: Plan, isCurrent: boolean }> = ({ plan, isCurrent }) => {
    return (
        <div className={`rounded-xl border p-6 flex flex-col ${isCurrent ? 'bg-amber-600/10 border-amber-500' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex-1">
                <h3 className={`text-lg font-semibold ${isCurrent ? 'text-amber-300' : 'text-white'}`}>{plan.name}</h3>
                {isCurrent && <span className="text-xs font-bold text-amber-300">PLANO ATUAL</span>}
                <p className="mt-2 text-4xl font-bold text-white">${plan.price}<span className="text-lg font-medium text-slate-400">/mês</span></p>
                <p className="mt-4 text-sm text-slate-400">Este plano inclui:</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Até {plan.maxInstances} instâncias
                    </li>
                     <li className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Acesso total à API
                    </li>
                     <li className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Suporte Básico
                    </li>
                </ul>
            </div>
            <button className={`mt-6 w-full py-2.5 rounded-md font-semibold text-sm transition-colors ${isCurrent ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-500'}`} disabled={isCurrent}>
                {isCurrent ? 'Seu Plano Atual' : 'Fazer Upgrade'}
            </button>
        </div>
    );
};

interface PlansViewProps {
  api: ReturnType<typeof useApi>;
  user: User;
}

const PlansView: React.FC<PlansViewProps> = ({ api }) => {
    const { getPlans, clientPlan } = api;
    const plans = getPlans();

  return (
    <div className="p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Encontre o plano certo para você</h2>
        <p className="mt-2 text-lg text-slate-400">Escale suas operações conforme você cresce.</p>
      </div>
      <div className="mt-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === clientPlan.id} />
        ))}
      </div>
    </div>
  );
};

export default PlansView;