'use client';

import { useState } from 'react';

interface TrespassLiabilityGateProps {
  onAccept: () => void;
  onCancel: () => void;
}

export default function TrespassLiabilityGate({ onAccept, onCancel }: TrespassLiabilityGateProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-2">
          Trespass Fee Acknowledgment
        </p>
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">
          Review & Accept Before Continuing
        </h2>

        <div className="max-h-48 overflow-y-auto bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-gray-600 leading-relaxed mb-5">
          <p className="mb-3">By proceeding to book this trespass fee hunt, you acknowledge and agree:</p>
          <p className="mb-2">
            <strong>1. INDEPENDENT CONTRACTOR:</strong> The landowner is an independent private property owner, not an agent or employee of HuntScouts. HuntScouts is not responsible for the condition of the land, wildlife access, safety, or any representations made by the landowner.
          </p>
          <p className="mb-2">
            <strong>2. ASSUMPTION OF RISK:</strong> Hunting involves inherent risks including but not limited to physical injury, property damage, and wildlife encounters. You assume all risk associated with your presence on the property.
          </p>
          <p className="mb-2">
            <strong>3. TRESPASS LAWS:</strong> Your booking confirmation grants you a license to be on the property only for the dates specified and species listed. Hunting beyond your licensed scope may constitute criminal trespass under applicable state law.
          </p>
          <p className="mb-2">
            <strong>4. NO GUARANTEE OF HARVEST:</strong> The landowner makes no guarantee of harvest success. Access to the property does not guarantee the presence of the listed species or successful hunting conditions.
          </p>
          <p className="mb-2">
            <strong>5. INSURANCE:</strong> HuntScouts recommends all hunters carry personal liability hunting insurance. You are solely responsible for any damage you cause to the property.
          </p>
          <p>
            <strong>6. DISPUTES:</strong> Any disputes regarding this trespass hunt must first be submitted to HuntScouts mediation before pursuing other legal remedies.
          </p>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-400"
          />
          <span className="text-sm text-gray-700 leading-snug">
            I have read and agree to the trespass hunting terms and liability disclaimer above
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="border border-stone-300 text-gray-600 font-bold px-6 py-3 rounded-xl hover:border-stone-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!agreed}
            className="bg-amber-400 text-black font-black px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors"
          >
            I Agree — Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
