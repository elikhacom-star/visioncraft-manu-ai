import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Globe, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '../utils';

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <Card className="max-w-lg w-full shadow-xl bg-white/90 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-bold text-slate-900">Contactez-nous</CardTitle>
                    <p className="text-slate-500 mt-2">Pour mettre à niveau votre abonnement ou pour toute question.</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Email</p>
                            <a href="mailto:elikaccesit@gmail.com" className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors break-all">
                                elikaccesit@gmail.com
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Téléphone</p>
                            <a href="tel:+32467801041" className="text-lg font-semibold text-slate-900 hover:text-green-600 transition-colors">
                                +32 467 80 10 41
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Site Internet</p>
                            <a href="https://elikacces.ovh" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                                elikacces.ovh
                            </a>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.location.href = createPageUrl('Pricing')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour aux tarifs
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}