'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Trash2, Calendar, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ProgressPhoto {
  id: string
  url: string
  date: string
  notes?: string
  category: 'front' | 'side' | 'back' | 'other'
}

interface ProgressPhotosProps {
  userId: string
}

export default function ProgressPhotos({ userId }: ProgressPhotosProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'front' | 'side' | 'back' | 'other'>('front')
  const [notes, setNotes] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${selectedCategory}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      // Save to database
      const { data, error } = await supabase
        .from('progress_photos')
        .insert({
          user_id: userId,
          url: publicUrl,
          category: selectedCategory,
          notes: notes,
          date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setPhotos(prev => [data, ...prev])
      setNotes('')
      
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (photo: ProgressPhoto) => {
    try {
      // Delete from storage
      const fileName = photo.url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('progress-photos')
          .remove([`${userId}/${photo.category}/${fileName}`])
      }

      // Delete from database
      await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photo.id)

      // Remove from local state
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Error deleting photo. Please try again.')
    }
  }

  const categories = [
    { id: 'front', label: 'Front View', icon: '🔽' },
    { id: 'side', label: 'Side View', icon: '➡️' },
    { id: 'back', label: 'Back View', icon: '🔼' },
    { id: 'other', label: 'Other', icon: '📷' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Progress Photos
        </h2>
        
        {/* Category Selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-lg border transition-all ${
                selectedCategory === category.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{category.icon}</div>
                <div className="text-xs text-white">{category.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Notes Input */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this photo (weight, measurements, etc.)"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none"
            rows={2}
          />
        </div>

        {/* Upload Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors disabled:opacity-50"
        >
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-white font-medium">
              {uploading ? 'Uploading...' : 'Take or Upload Photo'}
            </span>
            <span className="text-gray-400 text-sm mt-1">
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} view
            </span>
          </div>
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photo Grid */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
        
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No progress photos yet</p>
            <p className="text-gray-500 text-sm">Start documenting your journey!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
              >
                <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt={`Progress photo - ${photo.category}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo)}
                      className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                  {photo.category}
                </div>

                {/* Date */}
                <div className="mt-2 text-center">
                  <p className="text-white text-sm font-medium">
                    {new Date(photo.date).toLocaleDateString()}
                  </p>
                  {photo.notes && (
                    <p className="text-gray-400 text-xs mt-1 truncate">
                      {photo.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedPhoto.category.charAt(0).toUpperCase() + selectedPhoto.category.slice(1)} View
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <img
                src={selectedPhoto.url}
                alt={`Progress photo - ${selectedPhoto.category}`}
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              
              {selectedPhoto.notes && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-white">{selectedPhoto.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}