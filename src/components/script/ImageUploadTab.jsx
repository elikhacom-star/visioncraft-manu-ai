import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, RefreshCw, Video, Image as ImageIcon } from "lucide-react";

export default function ImageUploadTab({
  uploadedImageUrl, isAnalyzingImage, isAnimating, isProcessing,
  animationPrompt, setAnimationPrompt, animationEffect, setAnimationEffect,
  animationEasing, setAnimationEasing, animationDuration, setAnimationDuration,
  animationModel, imageFilters, setImageFilters,
  handleImageUpload, handleAnimateImage, t
}) {
  return (
    <div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors bg-white/50">
        <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" disabled={isAnalyzingImage || isProcessing} />
        <label htmlFor="image-upload" className={`cursor-pointer flex flex-col items-center gap-4 ${isAnalyzingImage ? 'opacity-50' : ''}`}>
          {uploadedImageUrl ? (
            <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-md">
              <img src={uploadedImageUrl} alt="Uploaded reference" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-amber-100 rounded-full text-amber-600"><Upload className="w-8 h-8" /></div>
              <div>
                <p className="font-medium text-slate-700">{t('label_upload_image')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('placeholder_upload_image')}</p>
              </div>
            </>
          )}
        </label>
        {isAnalyzingImage && (
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('analyzing_image')}</span>
          </div>
        )}
        {uploadedImageUrl && !isAnalyzingImage && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
            <ImageIcon className="w-4 h-4" />{t('use_image_as_scene')}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('label_animation_prompt')}</label>
            <Textarea placeholder={t('placeholder_animation_prompt')} value={animationPrompt} onChange={(e) => setAnimationPrompt(e.target.value)} className="bg-white/50" disabled={isAnimating} />
          </div>
          <div className="col-span-2">
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-slate-600">{t('label_duration')}</label>
              <span className="text-xs text-slate-500">{animationDuration}s</span>
            </div>
            <Slider value={[animationDuration]} onValueChange={(val) => setAnimationDuration(val[0])} min={2} max={15} step={1} disabled={isAnimating || animationModel !== 'native-client'} className={animationModel !== 'native-client' ? 'opacity-50' : ''} />
            {animationModel !== 'native-client' && <p className="text-[10px] text-gray-400 mt-1">{t('duration_note')}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('label_animation_style')}</label>
            <Select value={animationEffect} onValueChange={setAnimationEffect} disabled={isAnimating}>
              <SelectTrigger className="bg-white/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom-in">{t('anim_zoom_in')}</SelectItem>
                <SelectItem value="zoom-out">{t('anim_zoom_out')}</SelectItem>
                <SelectItem value="pan-left">{t('anim_pan_left')} (→)</SelectItem>
                <SelectItem value="pan-right">{t('anim_pan_right')} (←)</SelectItem>
                <SelectItem value="pan-up">{t('anim_pan_up')} (↑)</SelectItem>
                <SelectItem value="pan-down">{t('anim_pan_down')} (↓)</SelectItem>
                <SelectItem value="rotate-cw">{t('anim_rotate_cw')} (↻)</SelectItem>
                <SelectItem value="rotate-ccw">{t('anim_rotate_ccw')} (↺)</SelectItem>
                <SelectItem value="pulse">{t('anim_pulse')}</SelectItem>
                <SelectItem value="shake">{t('anim_shake')}</SelectItem>
                <SelectItem value="blur-focus">{t('anim_blur_focus')}</SelectItem>
                <SelectItem value="breathe">{t('anim_breathe')}</SelectItem>
                <SelectItem value="float">{t('anim_float')}</SelectItem>
                <SelectItem value="sway">{t('anim_sway')}</SelectItem>
                <SelectItem value="heartbeat">{t('anim_heartbeat')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('label_easing')}</label>
            <Select value={animationEasing} onValueChange={setAnimationEasing} disabled={isAnimating}>
              <SelectTrigger className="bg-white/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">{t('ease_linear')}</SelectItem>
                <SelectItem value="ease-in">{t('ease_in')}</SelectItem>
                <SelectItem value="ease-out">{t('ease_out')}</SelectItem>
                <SelectItem value="ease-in-out">{t('ease_in_out')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-end pb-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="single-vignette" checked={imageFilters.vignette} onChange={(e) => setImageFilters({ ...imageFilters, vignette: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-amber-600" disabled={isAnimating} />
              <Label htmlFor="single-vignette">{t('label_vignette')}</Label>
            </div>
          </div>
          <div className="col-span-2 space-y-4 pt-2 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('label_motion_depth')}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500"><span>{t('label_3d_tilt_x')}</span><span>{imageFilters.tiltX || 0}</span></div>
                <Slider value={[imageFilters.tiltX || 0]} onValueChange={(val) => setImageFilters({ ...imageFilters, tiltX: val[0] })} min={-10} max={10} step={1} disabled={isAnimating} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500"><span>{t('label_3d_tilt_y')}</span><span>{imageFilters.tiltY || 0}</span></div>
                <Slider value={[imageFilters.tiltY || 0]} onValueChange={(val) => setImageFilters({ ...imageFilters, tiltY: val[0] })} min={-10} max={10} step={1} disabled={isAnimating} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500"><span>{t('label_contrast')}</span><span>{imageFilters.contrast}%</span></div>
              <Slider value={[imageFilters.contrast]} onValueChange={(val) => setImageFilters({ ...imageFilters, contrast: val[0] })} min={50} max={150} step={5} disabled={isAnimating} />
            </div>
          </div>
        </div>
        <Button onClick={handleAnimateImage} disabled={!uploadedImageUrl || isAnimating} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50">
          {isAnimating ? (
            <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />{t('status_animating')}</div>
          ) : (
            <div className="flex items-center gap-2"><Video className="w-5 h-5" />{t('btn_animate_image')}</div>
          )}
        </Button>
      </div>
    </div>
  );
}