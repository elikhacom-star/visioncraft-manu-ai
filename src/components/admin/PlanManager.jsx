import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Crown, DollarSign, Zap } from 'lucide-react';
import { toast } from "sonner";

export default function PlanManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    
    const [formData, setFormData] = useState({
        plan_id: '',
        name: '',
        price: 0,
        monthly_video_limit: 3,
        features: [],
        is_active: true
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: () => base44.entities.SubscriptionPlan.list(),
    });

    const createPlanMutation = useMutation({
        mutationFn: (data) => base44.entities.SubscriptionPlan.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptionPlans']);
            toast.success("Plan créé avec succès");
            resetForm();
        },
    });

    const updatePlanMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.SubscriptionPlan.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptionPlans']);
            toast.success("Plan mis à jour");
            resetForm();
        },
    });

    const deletePlanMutation = useMutation({
        mutationFn: (id) => base44.entities.SubscriptionPlan.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptionPlans']);
            toast.success("Plan supprimé");
        },
    });

    const resetForm = () => {
        setFormData({
            plan_id: '',
            name: '',
            price: 0,
            monthly_video_limit: 3,
            features: [],
            is_active: true
        });
        setEditingPlan(null);
        setIsDialogOpen(false);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            plan_id: plan.plan_id,
            name: plan.name,
            price: plan.price || 0,
            monthly_video_limit: plan.monthly_video_limit,
            features: plan.features || [],
            is_active: plan.is_active !== false
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.plan_id || !formData.name) {
            toast.error("Plan ID et nom requis");
            return;
        }

        if (editingPlan) {
            updatePlanMutation.mutate({ id: editingPlan.id, data: formData });
        } else {
            createPlanMutation.mutate(formData);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce plan ?")) {
            deletePlanMutation.mutate(id);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gestion des Plans d'Abonnement</CardTitle>
                        <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouveau Plan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Limite Mensuelle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <Badge variant="outline">{plan.plan_id}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-3 h-3 text-green-600" />
                                            {plan.price || 0}€
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                            {plan.monthly_video_limit} vidéos
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active !== false ? 'default' : 'secondary'}>
                                            {plan.is_active !== false ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleEdit(plan)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDelete(plan.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPlan ? 'Modifier le Plan' : 'Créer un Nouveau Plan'}
                        </DialogTitle>
                        <DialogDescription>
                            Configurez les détails du plan d'abonnement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Plan ID *</Label>
                                <Input 
                                    value={formData.plan_id}
                                    onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                                    placeholder="free, pro, enterprise..."
                                    disabled={!!editingPlan}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom du Plan *</Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Free, Pro, Enterprise..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prix (€/mois)</Label>
                                <Input 
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Limite Mensuelle *</Label>
                                <Input 
                                    type="number"
                                    value={formData.monthly_video_limit}
                                    onChange={(e) => setFormData({...formData, monthly_video_limit: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Fonctionnalités (une par ligne)</Label>
                            <textarea 
                                value={formData.features.join('\n')}
                                onChange={(e) => setFormData({...formData, features: e.target.value.split('\n').filter(f => f.trim())})}
                                className="w-full h-24 border rounded-md p-2 text-sm"
                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">Plan actif</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetForm}>Annuler</Button>
                        <Button onClick={handleSubmit} disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                            {editingPlan ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}