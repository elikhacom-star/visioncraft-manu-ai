import React, { useState } from 'react';
import { BookOpen, Video, FileText, Mic, Palette, Users, Wand2, Link, Music, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const features = [
  {
    icon: FileText,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    badge: 'Script',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    title: 'Modèles de scripts par genre (Templates)',
    location: 'Page Home → Bouton vert "Templates"',
    apiRequired: false,
    description: 'Une bibliothèque de modèles de scripts prédéfinis pour divers genres vous aide à démarrer rapidement votre projet.',
    steps: [
      'Cliquez sur le bouton vert "Templates" en haut de la zone de script.',
      'Une fenêtre s\'ouvre avec les genres disponibles : Pub, Tutoriel, Storytelling, Pitch Startup, Vlog, Court-métrage, Motivation, News.',
      'Sélectionnez un genre. Le modèle de script correspondant se charge automatiquement dans votre zone de saisie.',
    ],
  },
  {
    icon: Wand2,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    badge: 'Script IA',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    title: 'Réécriture par ton (Tone Rewriter)',
    location: 'Page Home → Bouton "Ton"',
    apiRequired: true,
    description: 'Réécrit votre script en l\'adaptant à un ton ou une ambiance spécifique grâce à l\'intelligence artificielle.',
    steps: [
      'Assurez-vous que votre script est présent dans la zone de saisie.',
      'Cliquez sur le bouton "Ton".',
      'Choisissez parmi : Humoristique, Professionnel, Dramatique, Enfantin, Poétique, Urgent, Intime, Épique.',
      'L\'IA reformule votre script selon le ton choisi.',
    ],
  },
  {
    icon: Link,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    badge: 'Script IA',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    title: 'Script depuis URL/Article',
    location: 'Page Home → Bouton "URL"',
    apiRequired: true,
    description: 'Génère un script vidéo complet à partir du contenu d\'une page web ou d\'un article en ligne.',
    steps: [
      'Cliquez sur le bouton "URL".',
      'Saisissez l\'adresse URL de la page web ou de l\'article source.',
      'L\'IA analyse le contenu et génère un script vidéo basé sur les informations extraites.',
    ],
  },
  {
    icon: Eye,
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    badge: 'Script',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    title: 'Détection automatique de langue',
    location: 'Page Home → Zone de saisie du script (automatique)',
    apiRequired: false,
    description: 'Détecte automatiquement la langue de votre script pendant que vous tapez et propose de la synchroniser avec les paramètres du projet.',
    steps: [
      'Écrivez votre script normalement dans la zone de saisie.',
      'Si une langue différente est détectée, un message de suggestion apparaît.',
      'Cliquez pour appliquer la nouvelle langue ou ignorez pour conserver la langue actuelle.',
    ],
  },
  {
    icon: Music,
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    badge: 'Audio',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    title: 'SFX automatiques intelligents',
    location: 'Intégré dans l\'édition de scène / Panneau audio',
    apiRequired: false,
    description: 'Analyse le texte et les émotions de chaque scène pour suggérer et générer automatiquement des effets sonores d\'ambiance via l\'API Web Audio du navigateur.',
    steps: [
      'Développez votre storyboard avec vos scènes.',
      'Le système analyse automatiquement les émotions et le contexte de chaque scène.',
      'Des effets sonores d\'ambiance (pluie, vent, foule, etc.) sont suggérés ou appliqués automatiquement.',
    ],
  },
  {
    icon: Users,
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    badge: 'Visuels',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    title: 'Cohérence visuelle des personnages',
    location: 'Panneau de personnages dans l\'édition de scène',
    apiRequired: false,
    description: 'Maintenez une apparence cohérente pour vos personnages récurrents à travers toutes les scènes en enregistrant leurs descriptions visuelles.',
    steps: [
      'Accédez au panneau de cohérence des personnages depuis l\'édition de scène.',
      'Ajoutez un profil pour chaque personnage avec des descriptions visuelles détaillées (vêtements, couleurs, traits).',
      'Ces informations sont automatiquement injectées dans les prompts de génération d\'images pour garder une apparence constante.',
    ],
  },
  {
    icon: Palette,
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    badge: 'Visuels',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    title: 'Banque de styles visuels',
    location: 'Interface d\'édition de scène → Sélecteur de style',
    apiRequired: false,
    description: 'Une bibliothèque de styles visuels prédéfinis (Réaliste, Anime, 3D, etc.) que vous pouvez appliquer pour influencer la génération d\'images.',
    steps: [
      'Ouvrez l\'éditeur de scène.',
      'Accédez à la section "Style" ou "Sélecteur de style".',
      'Parcourez les catégories et sous-styles disponibles.',
      'Sélectionnez un style pour l\'appliquer à vos scènes. Vous pouvez aussi importer une image de référence.',
    ],
  },
  {
    icon: Video,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    badge: 'Aperçu',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    title: 'Aperçu vidéo en temps réel',
    location: 'Page Home → Fenêtre de prévisualisation intégrée',
    apiRequired: false,
    description: 'Visualisez votre projet vidéo en direct pendant que vous apportez des modifications à votre script ou vos scènes.',
    steps: [
      'La fenêtre de prévisualisation est directement visible dans votre espace de travail principal.',
      'Continuez à travailler sur votre projet (script, scènes, styles).',
      'La prévisualisation se met à jour dynamiquement pour refléter vos modifications en temps réel.',
    ],
  },
];

function FeatureCard({ feature }) {
  const [open, setOpen] = useState(false);
  const Icon = feature.icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200">
      <button
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className={`p-3 rounded-xl ${feature.color} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${feature.badgeColor}`}>
              {feature.badge}
            </span>
            {feature.apiRequired && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                Nécessite API
              </span>
            )}
            {!feature.apiRequired && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                Sans clé API
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-snug">{feature.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">📍 {feature.location}</p>
        </div>
        <div className="shrink-0 text-slate-400 mt-1">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{feature.description}</p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Comment l'utiliser :</p>
            {feature.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Guide() {
  const [filter, setFilter] = useState('Tout');
  const categories = ['Tout', 'Script', 'Script IA', 'Audio', 'Visuels', 'Aperçu'];

  const filtered = filter === 'Tout' ? features : features.filter(f => f.badge === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Guide des Fonctionnalités</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            Découvrez toutes les options disponibles dans Visioncraft AI — où les trouver et comment les utiliser.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {filtered.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-10">
          Visioncraft AI — Guide mis à jour le {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}