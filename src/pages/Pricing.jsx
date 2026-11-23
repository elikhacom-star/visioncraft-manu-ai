import React from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown, Building } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
    const { t } = useLanguage();
    
    // Fetch current user data
    const { data: user } = useQuery({
        queryKey: ['userMe'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    const currentPlan = user?.subscription_plan || 'free';

    const handleUpgrade = (plan) => {
        window.location.href = createPageUrl('Contact');
    };

    const plans = [
        {
            id: 'free',
            name: t('plan_free'),
            price: t('price_free'),
            icon: Zap,
            description: "Perfect for trying out Visioncraft AI",
            features: [
                t('feature_limit_3'),
                t('feature_hd'),
                "Standard AI Voices",
                "Community Support"
            ],
            missing: [
                t('feature_4k'),
                t('feature_commercial'),
                t('feature_support')
            ],
            color: "blue"
        },
        {
            id: 'pro',
            name: t('plan_pro'),
            price: t('price_pro'),
            icon: Crown,
            description: "For serious creators and influencers",
            popular: true,
            features: [
                t('feature_limit_50'),
                t('feature_4k'),
                t('feature_commercial'),
                "Premium AI Voices",
                t('feature_support')
            ],
            missing: [],
            color: "amber"
        },
        {
            id: 'enterprise',
            name: t('plan_enterprise'),
            price: "Custom",
            icon: Building,
            description: "For agencies and large teams",
            features: [
                t('feature_limit_unlimited'),
                "API Access",
                "Custom Branding",
                "Dedicated Account Manager"
            ],
            missing: [],
            color: "slate"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                    {t('pricing_title')}
                </h1>
                <p className="mt-5 text-xl text-slate-500">
                    {t('pricing_subtitle')}
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3">
                {plans.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    const Icon = plan.icon;

                    return (
                        <Card 
                            key={plan.id} 
                            className={`relative flex flex-col ${plan.popular ? 'border-amber-500 shadow-xl scale-105 z-10' : 'border-gray-200 shadow-md'} transition-all hover:shadow-lg`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-3 -mr-3">
                                    <Badge className="bg-amber-500 text-white px-3 py-1 text-sm font-semibold shadow-sm">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                                    plan.color === 'amber' ? 'bg-amber-100 text-amber-600' : 
                                    plan.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <div className="mt-2 flex items-baseline">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                                    {plan.price !== 'Custom' && <span className="ml-1 text-xl font-semibold text-slate-500">{t('period_month')}</span>}
                                </div>
                                <CardDescription className="mt-2">{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-500" />
                                            </div>
                                            <p className="ml-3 text-sm text-slate-700">{feature}</p>
                                        </li>
                                    ))}
                                    {plan.missing.map((feature, i) => (
                                        <li key={i} className="flex items-start opacity-50">
                                            <div className="flex-shrink-0">
                                                <X className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <p className="ml-3 text-sm text-slate-500">{feature}</p>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {isCurrent ? (
                                    <Button disabled className="w-full bg-slate-100 text-slate-400 border-0">
                                        {t('btn_current_plan')}
                                    </Button>
                                ) : (
                                    <Button 
                                        className={`w-full ${
                                            plan.popular 
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                        }`}
                                        onClick={() => handleUpgrade(plan.id)}
                                    >
                                        {plan.id === 'enterprise' ? t('btn_contact') : t('btn_upgrade')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}