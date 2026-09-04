// EduGuard MDM — Web Filtering & Safe Browsing Configuration (Clean Minimalism)

import React, { useState } from 'react';
import {
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { WebFilterRule, WebFilterCategory } from '../types/mdm';

interface WebFilterViewProps {
  rules: WebFilterRule[];
  categories: WebFilterCategory[];
  onAddRule: (rule: Partial<WebFilterRule>) => void;
  onDeleteRule: (ruleId: string) => void;
}

export const WebFilterView: React.FC<WebFilterViewProps> = ({
  rules,
  categories,
  onAddRule,
  onDeleteRule,
}) => {
  const [activeTab, setActiveTab] = useState<'domains' | 'keywords' | 'categories' | 'tester'>('domains');
  const [newPattern, setNewPattern] = useState('');
  const [newType, setNewType] = useState<'DOMAIN' | 'KEYWORD'>('DOMAIN');
  const [newAction, setNewAction] = useState<'ALLOW' | 'BLOCK'>('BLOCK');
  const [newDescription, setNewDescription] = useState('');

  // Live domain tester state
  const [testUrl, setTestUrl] = useState('instagram.com');
  const [testResult, setTestResult] = useState<{
    action: 'ALLOWED' | 'BLOCKED';
    reason: string;
    matchedRule?: string;
  } | null>(null);

  const domainRules = rules.filter((r) => r.type === 'DOMAIN');
  const keywordRules = rules.filter((r) => r.type === 'KEYWORD');

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;

    onAddRule({
      type: newType,
      pattern: newPattern.toLowerCase().trim(),
      action: newAction,
      description: newDescription || (newAction === 'BLOCK' ? 'Blocked domain' : 'Allowed domain'),
      targetScope: 'GLOBAL',
    });

    setNewPattern('');
    setNewDescription('');
  };

  const runDomainTest = () => {
    if (!testUrl || !testUrl.trim()) return;
    const clean = testUrl.toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0];

    // 1. Explicit allow
    const allowed = domainRules.find((r) => r.action === 'ALLOW' && clean.includes(r.pattern));
    if (allowed) {
      setTestResult({
        action: 'ALLOWED',
        reason: `Explicitly permitted by domain allowlist rule: "${allowed.pattern}"`,
        matchedRule: allowed.pattern,
      });
      return;
    }

    // 2. Explicit block
    const blocked = domainRules.find((r) => r.action === 'BLOCK' && clean.includes(r.pattern));
    if (blocked) {
      setTestResult({
        action: 'BLOCKED',
        reason: `Connection sinkholed to 127.0.0.1 by rule: "${blocked.pattern}"`,
        matchedRule: blocked.pattern,
      });
      return;
    }

    // 3. Keyword block
    const matchedKw = keywordRules.find((r) => r.action === 'BLOCK' && clean.includes(r.pattern));
    if (matchedKw) {
      setTestResult({
        action: 'BLOCKED',
        reason: `Matched prohibited keyword filter: "${matchedKw.pattern}"`,
        matchedRule: matchedKw.pattern,
      });
      return;
    }

    // Default
    setTestResult({
      action: 'ALLOWED',
      reason: 'No blocking rules matched. Connection routed via normal DNS.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Alert */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex items-start space-x-3.5 text-gray-950">
        <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-semibold text-gray-950 text-sm">Enterprise DNS & HTTPS SNI Filtering Engine</h4>
          <p className="text-gray-400 mt-1 leading-relaxed">
            EduGuard MDM enforces web safety via local Android <span className="font-mono font-semibold text-gray-800">VpnService</span> loopback DNS interception (UDP 53) and TLS 1.3 ClientHello Server Name Indication (SNI) checks without invasive TLS MITM certificate tampering.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('domains')}
          className={`py-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'domains' ? 'border-gray-950 text-gray-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-900'
          }`}
        >
          Domain Rules ({domainRules.length})
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`py-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'keywords' ? 'border-gray-950 text-gray-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-900'
          }`}
        >
          Blocked Keywords ({keywordRules.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories' ? 'border-gray-950 text-gray-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-900'
          }`}
        >
          Web Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`py-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'tester' ? 'border-gray-950 text-gray-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-900'
          }`}
        >
          Live Domain Evaluation Sandbox
        </button>
      </div>

      {/* Tab 1: Domain Rules */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Rule Form */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Add Domain Rule</h4>
            <form onSubmit={handleAddRuleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Domain Pattern</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. reddit.com or *.wikipedia.org"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Enforcement Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAction('BLOCK')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                      newAction === 'BLOCK' ? 'bg-gray-950 text-white border-gray-950 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Block / Sinkhole
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAction('ALLOW')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                      newAction === 'ALLOW' ? 'bg-gray-950 text-white border-gray-950 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Allowlist
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Social media restriction"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                Add Rule to Policy
              </button>
            </form>
          </div>

          {/* Rules List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-950">Active Domain Rules</span>
              <span className="text-gray-400 text-xs">Global Hierarchy</span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              {domainRules.map((rule) => (
                <div key={rule.id} className="p-4.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        rule.action === 'BLOCK' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {rule.action}
                    </span>
                    <div>
                      <span className="font-mono font-semibold text-gray-950">{rule.pattern}</span>
                      <p className="text-[11px] text-gray-400">{rule.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Keywords */}
      {activeTab === 'keywords' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-gray-950">Prohibited Search Keywords</h4>
              <p className="text-xs text-gray-400 mt-0.5">Intercepted during web browser queries</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {keywordRules.map((kw) => (
              <span
                key={kw.id}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold"
              >
                <span>{kw.pattern}</span>
                <button
                  onClick={() => onDeleteRule(kw.id)}
                  className="text-gray-400 hover:text-rose-600 cursor-pointer ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm text-gray-950">{cat.name}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      cat.blocked ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.blocked ? 'BLOCKED' : 'ALLOWED'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cat.sampleDomains.map((d, i) => (
                    <span key={i} className="text-[10px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-lg font-mono">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Tester */}
      {activeTab === 'tester' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs max-w-xl space-y-4">
          <h4 className="font-semibold text-sm text-gray-950">Test Domain Against Active Policy Precedence</h4>
          <p className="text-xs text-gray-400">
            Simulates the DPC DNS interceptor logic to verify if a domain would be resolved or sinkholed.
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. instagram.com or classroom.google.com"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="flex-1 p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
            <button
              onClick={runDomainTest}
              className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Evaluate
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 ${
                testResult.action === 'BLOCKED'
                  ? 'bg-rose-50 border-rose-100 text-rose-900'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-900'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm">
                {testResult.action === 'BLOCKED' ? <XCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                <span>Result: {testResult.action}</span>
              </div>
              <p>{testResult.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
