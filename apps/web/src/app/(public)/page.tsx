import { ArrowRight, CheckCircle2, LockKeyhole, Network, Route, ShieldCheck, TrendingDown } from 'lucide-react';
import Link from 'next/link';

import styles from './page.module.css';

import { PlatformPreview } from '@/components/shared/platform-preview';
import { Button } from '@/components/ui/button';

const benefits = [
  'Custos de frete comparaveis por rota, cliente e transportadora.',
  'Operacao multi-tenant com trilha de auditoria desde a fundacao.',
  'Base preparada para filas, importacoes, tempo real e integracoes externas.',
];

const differentiators = [
  { title: 'Precisao operacional', icon: Route, text: 'Dados de peso, dimensoes, prazo e valor seguem contratos tipados.' },
  { title: 'Governanca segura', icon: ShieldCheck, text: 'Rotas privadas por padrao, tenant no contexto e logs sanitizados.' },
  { title: 'Evolucao incremental', icon: Network, text: 'Modulos desacoplados para fretes, importacoes, insights e auditoria.' },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Nexora Freight">
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <nav aria-label="Navegacao publica">
          <Link href={'/register' as never}>Criar conta</Link>
          <Link href="/login">Entrar</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Inteligencia logistica multi-tenant</p>
          <h1>Nexora Freight</h1>
          <p>
            Controle custos, simule cenarios e organize decisoes de frete com uma base segura
            para operacoes B2B em crescimento.
          </p>
          <div className={styles.actions}>
            <Link href={'/register' as never}>
              <Button>
                Comecar agora <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </Link>
            <Link href={'/register' as never} className={styles.secondaryLink}>
              Criar conta
            </Link>
            <Link href="#seguranca" className={styles.secondaryLink}>
              Ver confiabilidade
            </Link>
          </div>
        </div>
        <PlatformPreview />
      </section>

      <section className={styles.band}>
        <div>
          <p className={styles.eyebrow}>Problema logistico</p>
          <h2>Fretes crescem quando dados, regras e aprovacoes ficam dispersos.</h2>
        </div>
        <p>
          A fundacao organiza simulacoes, cadastros, auditoria e processamento assincrono para
          reduzir retrabalho antes de automatizar regras especificas de cotacao.
        </p>
      </section>

      <section className={styles.benefits} aria-labelledby="benefits-title">
        <div>
          <p className={styles.eyebrow}>Beneficios</p>
          <h2 id="benefits-title">Uma base para decisao logistica mensuravel.</h2>
        </div>
        <ul>
          {benefits.map((benefit) => (
            <li key={benefit}>
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.differentiators}>
        {differentiators.map((item) => (
          <article key={item.title}>
            <item.icon size={22} aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className={styles.metrics} aria-label="Indicadores ilustrativos">
        <article>
          <TrendingDown size={20} aria-hidden="true" />
          <strong>8% a 14%</strong>
          <span>economia estimada em cenarios comparativos</span>
        </article>
        <article>
          <Route size={20} aria-hidden="true" />
          <strong>24h</strong>
          <span>visao consolidada de rotas e custos recentes</span>
        </article>
        <article>
          <LockKeyhole size={20} aria-hidden="true" />
          <strong>100%</strong>
          <span>rotas privadas por padrao na arquitetura da API</span>
        </article>
      </section>

      <section id="seguranca" className={styles.security}>
        <div>
          <p className={styles.eyebrow}>Seguranca e confiabilidade</p>
          <h2>Isolamento por empresa desde a camada de dados.</h2>
          <p>
            Tenant no contexto autenticado, cache com namespace, filas escopadas, auditoria e
            politica de logs sem credenciais ou tokens.
          </p>
        </div>
        <Link href={'/register' as never}>
          <Button variant="secondary">Criar conta</Button>
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>Nexora Freight</span>
        <span>Fundacao tecnica para inteligencia logistica.</span>
      </footer>
    </main>
  );
}
