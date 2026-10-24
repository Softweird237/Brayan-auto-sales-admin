'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import {
  Plus,
  Trash2,
  Car,
  Settings,
  Sliders,
  Search,
  Sparkles,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  Coins,
  History,
  X,
  Gauge,
  Calendar,
  Compass,
  Database,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  Send,
  Lock,
  Clock,
  ArrowLeft,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react'

interface CreditApp {
  id: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  vehicle_id?: string
  vehicle_name?: string
  applicant_name: string
  address: string
  dob: string
  ssn: string
  email: string
  phone: string
  employer_name: string
  job_title: string
  monthly_salary: string
  employment_status: string
  other_income_source?: string
  loan_amount: string
  loan_purpose: string
  repayment_term: string
  interest_rate: string
  make: string
  model: string
  year: string
  purchase_price: string
  trade_in_value?: string
}

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Auto-restore admin session
  useEffect(() => {
    const saved = localStorage.getItem('brayan_admin_authenticated')
    if (saved === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<'inventory' | 'credits'>('inventory')

  // Credit Applications States
  const [creditApps, setCreditApps] = useState<CreditApp[]>([])
  const [isLoadingCreditApps, setIsLoadingCreditApps] = useState(true)
  const [selectedCreditApp, setSelectedCreditApp] = useState<CreditApp | null>(null)
  const [creditFilterStatus, setCreditFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [creditSearchTerm, setCreditSearchTerm] = useState('')

  // Core Listings States
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPostModal, setShowPostModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)



  // Status Alerts
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [price, setPrice] = useState('')
  const [daysLeft, setDaysLeft] = useState('7 Days')
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [transmission, setTransmission] = useState('Manual')
  const [bodyStyle, setBodyStyle] = useState('Sedan')
  const [specs, setSpecs] = useState('')
  const [location, setLocation] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [noReserve, setNoReserve] = useState(false)
  const [bucketSlug, setBucketSlug] = useState('')

  // Nested Details Form State
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [vin, setVin] = useState('')
  const [mileage, setMileage] = useState('')
  const [titleStatus, setTitleStatus] = useState('Clean')
  const [drivetrain, setDrivetrain] = useState('')
  const [engine, setEngine] = useState('')
  const [exteriorColor, setExteriorColor] = useState('')
  const [interiorColor, setInteriorColor] = useState('')
  const [seller, setSeller] = useState('Brayan Auto Sales')
  const [sellerType, setSellerType] = useState('Dealer')
  const [ownershipHistory, setOwnershipHistory] = useState('')
  const [sellerNotes, setSellerNotes] = useState('')

  // Multi-value list arrays
  const [highlights, setHighlights] = useState<string[]>([''])
  const [equipment, setEquipment] = useState<string[]>([''])
  const [flaws, setFlaws] = useState<string[]>([''])
  const [serviceHistory, setServiceHistory] = useState<string[]>([''])
  const [itemsIncluded, setItemsIncluded] = useState<string[]>([''])

  // Image upload
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')

  // Fetch all listings
  async function loadListings() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setVehicles(data)
      } else {
        console.error(error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  // 3. Fetch credit applications & subscribe to realtime changes on mount
  useEffect(() => {
    let isMounted = true

    const loadCreditApps = async () => {
      setIsLoadingCreditApps(true)
      let dbApps: CreditApp[] = []

      try {
        const { data, error } = await supabase
          .from('credit_applications')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          dbApps = data
        }
      } catch (e) {
        console.warn('DB fetch notice:', e)
      }

      // Merge with LocalStorage fallback items if present
      let localApps: CreditApp[] = []
      if (typeof window !== 'undefined') {
        try {
          localApps = JSON.parse(localStorage.getItem('mandel_credit_applications') || '[]')
        } catch (e) {}
      }

      const existingIds = new Set(dbApps.map(a => a.id))
      const combined = [...dbApps]
      localApps.forEach(app => {
        if (!existingIds.has(app.id)) {
          combined.push(app)
        }
      })

      if (isMounted) {
        setCreditApps(combined)
        setIsLoadingCreditApps(false)
      }
    }

    loadCreditApps()

    const creditChannel = supabase
      .channel('admin_credit_apps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_applications' },
        (payload) => {
          if (!isMounted) return
          if (payload.eventType === 'INSERT') {
            const newApp = payload.new as CreditApp
            setCreditApps(prev => [newApp, ...prev.filter(c => c.id !== newApp.id)])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CreditApp
            setCreditApps(prev => prev.map(c => c.id === updated.id ? updated : c))
            setSelectedCreditApp(prev => prev?.id === updated.id ? updated : prev)
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setCreditApps(prev => prev.filter(c => c.id !== deletedId))
            setSelectedCreditApp(prev => prev?.id === deletedId ? null : prev)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(creditChannel)
    }
  }, [])

  // 2. Fetch messages & subscribe for the active conversation thread
  useEffect(() => {
    if (!selectedConv) return

    let isMounted = true
    const messageContainer = document.getElementById('chat-messages-container')

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true })

      if (!error && data && isMounted) {
        setMessages(data)
        setTimeout(() => {
          if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
        }, 100)
      }
      setIsLoadingMessages(false)
    }

    loadMessages()

    const threadChannel = supabase
      .channel(`admin_thread_${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          if (!isMounted) return
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(() => {
            if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
          }, 50)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(threadChannel)
    }
  }, [selectedConv?.id])

  // Update Credit Application Status
  const updateCreditStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      if (!id.startsWith('local-')) {
        await supabase
          .from('credit_applications')
          .update({ status })
          .eq('id', id)
      }

      // Update state & localStorage
      setCreditApps(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      if (selectedCreditApp?.id === id) {
        setSelectedCreditApp(prev => prev ? { ...prev, status } : null)
      }

      if (typeof window !== 'undefined') {
        try {
          const existing: CreditApp[] = JSON.parse(localStorage.getItem('mandel_credit_applications') || '[]')
          const updated = existing.map(c => c.id === id ? { ...c, status } : c)
          localStorage.setItem('mandel_credit_applications', JSON.stringify(updated))
        } catch (e) {}
      }

      triggerSuccess(`Credit application marked as ${status}!`)
    } catch (err: any) {
      triggerError(err.message || 'Error updating application')
    }
  }

  // Delete Credit Application
  const deleteCreditApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit application?')) return
    try {
      if (!id.startsWith('local-')) {
        await supabase.from('credit_applications').delete().eq('id', id)
      }

      setCreditApps(prev => prev.filter(c => c.id !== id))
      if (selectedCreditApp?.id === id) setSelectedCreditApp(null)

      if (typeof window !== 'undefined') {
        try {
          const existing: CreditApp[] = JSON.parse(localStorage.getItem('mandel_credit_applications') || '[]')
          const updated = existing.filter(c => c.id !== id)
          localStorage.setItem('mandel_credit_applications', JSON.stringify(updated))
        } catch (e) {}
      }

      triggerSuccess('Credit application deleted.')
    } catch (err: any) {
      triggerError(err.message || 'Error deleting application')
    }
  }

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim() || !selectedConv) return

    const replyText = newMessageText.trim()
    setNewMessageText('')

    // Add optimistically to current thread list
    const tempId = Math.random().toString(36).substring(7)
    const tempMsg: Message = {
      id: tempId,
      conversation_id: selectedConv.id,
      sender: 'admin',
      content: replyText,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    const messageContainer = document.getElementById('chat-messages-container')
    setTimeout(() => {
      if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
    }, 50)

    try {
      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: selectedConv.id,
        sender: 'admin',
        content: replyText,
      })

      if (msgErr) {
        console.error('Failed to send reply:', msgErr)
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        return
      }

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConv.id)
    } catch (err) {
      console.error(err)
    }
  }

  // Filtering Logic for Inquiries
  const filteredConversations = conversations.filter((conv) => {
    const matchesStatus = chatFilterStatus === 'all' || conv.status === chatFilterStatus
    const matchesSearch =
      conv.user_name.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      conv.vehicle_name.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      (conv.user_email && conv.user_email.toLowerCase().includes(chatSearchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Filtering Logic for Credit Applications
  const filteredCreditApps = creditApps.filter((app) => {
    const matchesStatus = creditFilterStatus === 'all' || app.status === creditFilterStatus
    const term = creditSearchTerm.toLowerCase()
    const matchesSearch =
      app.applicant_name.toLowerCase().includes(term) ||
      app.email.toLowerCase().includes(term) ||
      app.phone.toLowerCase().includes(term) ||
      (app.vehicle_name && app.vehicle_name.toLowerCase().includes(term)) ||
      (app.make && app.make.toLowerCase().includes(term)) ||
      (app.model && app.model.toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })

  // Delete Listing
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this listing from Brayan Auto Sales?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (!error) {
        setVehicles(prev => prev.filter(v => v.id !== id))
        triggerSuccess('Listing deleted successfully!')
      } else {
        triggerError('Failed to delete listing: ' + error.message)
      }
    } catch (e: any) {
      triggerError(e.message || 'An error occurred.')
    }
  }

  // Handle Multi-value list adjustments
  function handleAddArrayField(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter(prev => [...prev, ''])
  }

  function handleArrayValueChange(
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  function handleRemoveArrayField(
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    currentArray: string[]
  ) {
    if (currentArray.length === 1) return
    setter(prev => prev.filter((_, i) => i !== index))
  }

  // Flash Feedback Alerts
  function triggerSuccess(msg: string) {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  function triggerError(msg: string) {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(''), 5000)
  }

  // Handle Image uploads to Supabase Storage
  async function uploadImages(folderSlug: string): Promise<string[]> {
    if (!selectedFiles || selectedFiles.length === 0) return []
    setUploadProgress('Uploading gallery images...')

    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${i + 1}_${Date.now()}.${fileExt}`
        const filePath = `${folderSlug}/${fileName}`

        setUploadProgress(`Uploading image ${i + 1} of ${selectedFiles.length}...`)

        const { data, error } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        if (error) {
          if (error.message && error.message.toLowerCase().includes('bucket not found')) {
            throw new Error('The storage folder "vehicle-images" is missing in your Supabase setup. Please go to your Supabase Storage dashboard, create a new public bucket named "vehicle-images", and try publishing again!')
          }
          throw error
        }

        if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(filePath)
          if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl)
          }
        }
      }
    } catch (e: any) {
      setUploadProgress('')
      throw e
    }

    setUploadProgress('')
    return uploadedUrls
  }

  // Submit Listing
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // 1. Generate standard folder slug for files
      const customFolderSlug = bucketSlug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000)

      // 2. Upload images to Supabase if files selected
      let uploadedUrls: string[] = []
      if (selectedFiles && selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(customFolderSlug)
      }

      // If mainImageUrl is empty, default to the first uploaded file
      const finalMainImage = mainImageUrl.trim() || uploadedUrls[0] || '/placeholder.jpg'

      // 3. Construct details JSON object
      const detailsJson = {
        make: make.trim(),
        model: model.trim(),
        vin: vin.trim().toUpperCase(),
        mileage: mileage.trim(),
        titleStatus: titleStatus,
        drivetrain: drivetrain.trim(),
        engine: engine.trim(),
        exteriorColor: exteriorColor.trim(),
        interiorColor: interiorColor.trim(),
        seller: seller.trim(),
        sellerType: sellerType,
        highlights: highlights.filter(h => h.trim() !== ''),
        equipment: equipment.filter(e => e.trim() !== ''),
        modifications: [], // Supported empty array
        flaws: flaws.filter(f => f.trim() !== ''),
        serviceHistory: serviceHistory.filter(s => s.trim() !== ''),
        itemsIncluded: itemsIncluded.filter(i => i.trim() !== ''),
        ownershipHistory: ownershipHistory.trim(),
        sellerNotes: sellerNotes.trim()
      }

      // 4. Construct DB payload
      const payload = {
        name: name.trim(),
        year: Number(year),
        price: Number(price) || 0,
        bids_count: 0,
        days_left: daysLeft.trim(),
        image: finalMainImage,
        images: uploadedUrls.length > 0 ? uploadedUrls : [finalMainImage],
        transmission,
        body_style: bodyStyle,
        specs: specs.trim(),
        location: location.trim(),
        is_featured: isFeatured,
        no_reserve: noReserve,
        bucket_slug: selectedFiles ? 'vehicle-images' : null, // Set to default storage bucket
        details: detailsJson
      }

      // 5. Write to DB
      const { data, error } = await supabase
        .from('vehicles')
        .insert(payload)
        .select()
        .single()

      if (!error && data) {
        setVehicles(prev => [data, ...prev])
        triggerSuccess(`"${name}" listed successfully on Brayan Auto Sales!`)
        setShowPostModal(false)
        resetForm()
      } else {
        triggerError('Database insert failed: ' + error?.message)
      }
    } catch (err: any) {
      triggerError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setName('')
    setYear(new Date().getFullYear())
    setPrice('')
    setDaysLeft('7 Days')
    setMainImageUrl('')
    setTransmission('Manual')
    setBodyStyle('Sedan')
    setSpecs('')
    setLocation('')
    setIsFeatured(false)
    setNoReserve(false)
    setBucketSlug('')

    setMake('')
    setModel('')
    setVin('')
    setMileage('')
    setTitleStatus('Clean')
    setDrivetrain('')
    setEngine('')
    setExteriorColor('')
    setInteriorColor('')
    setSeller('Brayan Auto Sales')
    setSellerType('Dealer')
    setOwnershipHistory('')
    setSellerNotes('')

    setHighlights([''])
    setEquipment([''])
    setFlaws([''])
    setServiceHistory([''])
    setItemsIncluded([''])
    setSelectedFiles(null)
  }

  // Pre-fill baseline seeder helper
  async function seedBaselineVehicles() {
    if (!confirm('Would you like to seed the baseline vehicle list into the database?')) return
    setIsLoading(true)

    const baselineData = [
      {
        name: '2015 Chevrolet SS',
        year: 2015,
        price: 42500,
        bids_count: 18,
        days_left: '2 Days',
        image: '/inventory/2015 Chevrolet SS.jpg',
        images: [
          '/inventory/2015 Chevrolet SS.jpg',
          '/inventory/2015 Chevrolet SS 2.jpg',
          '/inventory/2015 Chevrolet SS 3.jpg'
        ],
        transmission: 'Manual',
        body_style: 'Sedan',
        specs: '6.2L LS3 V8 engine, rare 6-speed manual transmission, finished in Slipstream Blue Metallic.',
        location: 'Phoenix, AZ',
        is_featured: true,
        no_reserve: false,
        details: {
          make: 'Chevrolet',
          model: 'SS',
          vin: '1G1Y85SWH9F29012A',
          mileage: '42,100 Miles',
          titleStatus: 'Clean',
          drivetrain: 'Rear-Wheel Drive',
          engine: '6.2L V8 LS3',
          exteriorColor: 'Slipstream Blue Metallic',
          interiorColor: 'Jet Black Leather',
          seller: 'Brayan Auto Sales',
          sellerType: 'Dealer',
          highlights: ['Rare 6-speed manual transmission', 'Magnetic Ride Control suspension', 'Brembo front brakes'],
          equipment: ['19-inch forged alloy wheels', 'Heated & ventilated front seats', 'Head-up display'],
          flaws: ['Minor rock chips on front bumper', 'Light curb rash on passenger front wheel'],
          serviceHistory: ['Oil changed recently', 'Tires replaced at 38,000 miles'],
          itemsIncluded: ['2 keys', 'Owner manuals', 'Window sticker'],
          ownershipHistory: 'Owned by a single enthusiast in Arizona since new.',
          sellerNotes: 'A pristine collector example of a legendary rear-drive muscle sedan.'
        }
      }
    ]

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(baselineData)
        .select()

      if (!error && data) {
        setVehicles(prev => [...data, ...prev])
        triggerSuccess('Baseline vehicle seeded successfully!')
      } else {
        triggerError('Failed to seed: ' + error?.message)
      }
    } catch (e: any) {
      triggerError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter listings based on search
  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.details?.vin && v.details.vin.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Authentication Handler (Supabase Auth + strict admin credentials)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setLoginError('')

    const cleanEmail = loginEmail.trim().toLowerCase()
    const cleanPassword = loginPassword.trim()

    const ALLOWED_ADMIN_EMAIL = 'brayanwayen678@gmail.com'
    const ALLOWED_ADMIN_PASSWORD = 'Lilbanga237#'

    if (cleanEmail !== ALLOWED_ADMIN_EMAIL || cleanPassword !== ALLOWED_ADMIN_PASSWORD) {
      setLoginError('Access denied. Invalid admin credentials.')
      setIsAuthenticating(false)
      return
    }

    try {
      await supabase.auth.signInWithPassword({
        email: ALLOWED_ADMIN_EMAIL,
        password: ALLOWED_ADMIN_PASSWORD,
      })
      setIsAuthenticated(true)
      localStorage.setItem('brayan_admin_authenticated', 'true')
      setLoginError('')
    } catch (err: any) {
      // Fallback verification if email confirmation is pending on dashboard
      setIsAuthenticated(true)
      localStorage.setItem('brayan_admin_authenticated', 'true')
      setLoginError('')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {}
    localStorage.removeItem('brayan_admin_authenticated')
    setIsAuthenticated(false)
    setLoginPassword('')
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full font-sans relative overflow-hidden min-h-[80vh]">
        <div className="absolute inset-0 bg-[#0a0a0a] z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0284c7]/5 rounded-full blur-[100px] z-0 pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-md bg-[#0b0f17] border border-[#1e293b] rounded-[12px] p-8 shadow-2xl">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#0284c7]/10 text-[#ffffff] flex items-center justify-center mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin Access</h2>
            <p className="text-sm font-semibold text-neutral-500 mt-1">Authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#181818] border border-[#334155] rounded-[6px] px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#0ea5e9] font-medium transition-colors"
                placeholder="Enter admin email"
              />
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#181818] border border-[#334155] rounded-[6px] px-4 py-3 pr-12 text-[14px] text-white focus:outline-none focus:border-[#0ea5e9] font-medium transition-colors"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-[6px] text-[13px] font-semibold border border-red-500/20">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full flex h-12 items-center justify-center gap-2 bg-[#0284c7] hover:bg-[#38bdf8] disabled:opacity-50 text-white rounded-[6px] text-sm font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-[#0284c7]/20 cursor-pointer mt-4"
            >
              {isAuthenticating ? 'Verifying...' : 'Sign In'} <ChevronRight size={16} strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-sans">

      {/* Tab Switcher Headers */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3.5 shrink-0">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex h-9 items-center justify-center gap-1.5 px-4 rounded-[6px] text-[11px] font-extrabold tracking-wider uppercase transition-all border cursor-pointer ${activeTab === 'inventory'
            ? 'bg-[#0284c7] text-black border-[#38d39f] shadow-lg shadow-[#38d39f]/10'
            : 'bg-transparent text-white hover:text-white border-transparent hover:bg-neutral-900'
            }`}
        >
          <Car size={13} />
          Inventory
        </button>
        
        <button
          onClick={() => setActiveTab('credits')}
          className={`flex h-9 items-center justify-center gap-1.5 px-4 rounded-[6px] text-[11px] font-extrabold tracking-wider uppercase transition-all border cursor-pointer relative ${activeTab === 'credits'
            ? 'bg-[#0284c7] text-black border-[#38d39f] shadow-lg shadow-[#38d39f]/10'
            : 'bg-transparent text-white hover:text-white border-transparent hover:bg-neutral-900'
            }`}
        >
          <Coins size={13} />
          Credits
          {creditApps.filter(c => c.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-full">
              {creditApps.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline-block text-[12px] text-neutral-400 font-medium">
            brayanwayen678@gmail.com
          </span>
          <button
            onClick={handleLogout}
            className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-[6px] text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            title="Sign out of Admin Dashboard"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>

          {/* Alert Banner */}
          {successMessage && (
            <div className="flex items-center gap-3 bg-[#0284c7]/10 border border-[#38d39f]/30 text-[#ffffff] px-4 py-3 rounded-[6px] text-[13.5px] font-semibold">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-[6px] text-[13.5px] font-semibold">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Overview stats header */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Active Inventory</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">{vehicles.length} Listings</h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-[#0284c7]/10 text-[#ffffff] flex items-center justify-center">
                <Car size={20} />
              </div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Featured Cars</p>
                <h3 className="text-2xl font-extrabold text-[#ffffff] mt-1">
                  {vehicles.filter(v => v.is_featured).length} Active
                </h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-[#0284c7]/10 text-[#ffffff] flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">No Reserve Listings</p>
                <h3 className="text-2xl font-extrabold text-blue-400 mt-1">
                  {vehicles.filter(v => v.no_reserve).length} Listings
                </h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Sliders size={20} />
              </div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Catalog Status</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">Live Sync</h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-neutral-800 text-white flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>
          </section>

          {/* Main Dashboard Panel Controls */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-[#1e293b]">

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by vehicle name, location, or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-[#334155] rounded-[6px] pl-10 pr-4 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-[#0ea5e9] font-medium"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-3">
              {vehicles.length === 0 && (
                <button
                  type="button"
                  onClick={seedBaselineVehicles}
                  className="flex h-11 items-center justify-center gap-2 border border-[#334155] bg-[#111827] hover:bg-[#202020] text-white px-5 rounded-[6px] text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <Car size={15} />
                  Load Sample Car
                </button>
              )}
              <button
                onClick={() => setShowPostModal(true)}
                className="flex h-11 items-center justify-center gap-2 bg-[#0284c7] hover:bg-[#2ec592] text-black px-5 rounded-[6px] text-xs font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-[#38d39f]/10 cursor-pointer"
              >
                <Plus size={16} strokeWidth={3} />
                Post New Arrival
              </button>
            </div>
          </section>

          {/* Active Listings Grid */}
          <section className="flex-1">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
                <div className="w-8 h-8 rounded-full border-2 border-[#1e293b] border-t-[#38d39f] animate-spin"></div>
                <p className="text-xs font-semibold">Loading inventory catalog...</p>
              </div>
            ) : filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className="group bg-[#0b0f17] border border-[#1e293b] rounded-[8px] overflow-hidden flex flex-col justify-between"
                  >
                    {/* Image panel */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#181818]">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="object-cover w-full h-full transform group-hover:scale-102 transition-transform duration-500"
                      />
                      {vehicle.is_featured && (
                        <span className="absolute top-3 left-3 bg-[#111827]/95 border border-[#1e293b] text-[#ffffff] text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase">
                          Featured
                        </span>
                      )}
                      {vehicle.no_reserve && (
                        <span className="absolute top-3 right-3 bg-blue-500/90 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase">
                          No Reserve
                        </span>
                      )}
                    </div>

                    {/* Details Panel */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-[15.5px] text-white tracking-tight hover:underline cursor-pointer">
                          {vehicle.name}
                        </h3>
                        <p className="text-[12px] text-white font-semibold flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#ffffff]" /> {vehicle.year}
                          <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                          <Gauge size={12} className="text-[#ffffff]" /> {vehicle.transmission}
                        </p>
                        <p className="text-[12.5px] text-white line-clamp-2 leading-relaxed">
                          {vehicle.specs}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                          <Compass size={11} /> {vehicle.location}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                        <div>
                          <p className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">Current Bid</p>
                          <p className="text-[15px] font-extrabold text-white">${vehicle.price.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-[5px] transition-colors cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-3 bg-[#0b0f17] border border-[#1e293b] rounded-[8px]">
                <Car size={32} className="mx-auto text-neutral-600 animate-bounce" />
                <h4 className="font-bold text-white">No vehicles currently listed</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Ready to post? Tap "Post New Arrival" to list a vehicle, or tap "Load Sample Car" to load an example listing.
                </p>
              </div>
            )}
          </section>

          {/* "Post New Arrival" Wizard Modal */}
          {showPostModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="relative w-full max-w-4xl bg-[#0b0f17] border border-[#1e293b] rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 bg-[#181818] border-b border-[#1e293b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus size={20} className="text-[#ffffff]" />
                    <h3 className="text-[16px] font-extrabold tracking-tight text-white uppercase">Post New Listing</h3>
                  </div>
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="p-1.5 bg-[#1e293b] hover:bg-[#2e2e2e] text-white hover:text-white rounded-[5px] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollable Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                  {/* SECTION 1: Core Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-[12.5px] font-bold text-[#ffffff] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
                      1. Core Specifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Vehicle Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2003 BMW M3 Convertible"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Year</label>
                        <input
                          type="number"
                          required
                          value={year}
                          onChange={e => setYear(Number(e.target.value))}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Price (USD)</label>
                        <input
                          type="number"
                          required
                          placeholder="42500"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Location</label>
                        <input
                          type="text"
                          required
                          placeholder="Phoenix, AZ"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Transmission</label>
                        <select
                          value={transmission}
                          onChange={e => setTransmission(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        >
                          <option value="Manual">Manual</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Body Style</label>
                        <select
                          value={bodyStyle}
                          onChange={e => setBodyStyle(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        >
                          <option value="Sedan">Sedan</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Convertible">Convertible</option>
                          <option value="Wagon">Wagon</option>
                          <option value="SUV">SUV</option>
                          <option value="Truck">Truck</option>
                          <option value="Hatchback">Hatchback</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Listing Duration</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 7 Days"
                          value={daysLeft}
                          onChange={e => setDaysLeft(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11.5px] font-bold text-white">Specs / Overview Description</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Short summary displayed under the card title (e.g. 6.2L LS3 V8 engine, finished in Daytona Grey)."
                        value={specs}
                        onChange={e => setSpecs(e.target.value)}
                        className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={e => setIsFeatured(e.target.checked)}
                          className="w-4 h-4 rounded border-[#1e293b] bg-[#181818] text-[#ffffff] focus:ring-0"
                        />
                        Featured Listing
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noReserve}
                          onChange={e => setNoReserve(e.target.checked)}
                          className="w-4 h-4 rounded border-[#1e293b] bg-[#181818] text-[#ffffff] focus:ring-0"
                        />
                        No Reserve Auction
                      </label>
                    </div>
                  </div>

                  {/* SECTION 2: Comprehensive Details Panel */}
                  <div className="space-y-4">
                    <h4 className="text-[12.5px] font-bold text-[#ffffff] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
                      2. Detailed Specifications (History & Build)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Make</label>
                        <input
                          type="text"
                          placeholder="e.g. BMW"
                          value={make}
                          onChange={e => setMake(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Model</label>
                        <input
                          type="text"
                          placeholder="e.g. M3"
                          value={model}
                          onChange={e => setModel(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">VIN</label>
                        <input
                          type="text"
                          placeholder="17 Character VIN"
                          value={vin}
                          onChange={e => setVin(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Mileage</label>
                        <input
                          type="text"
                          placeholder="e.g. 42,100 Miles"
                          value={mileage}
                          onChange={e => setMileage(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Title Status</label>
                        <input
                          type="text"
                          placeholder="e.g. Clean"
                          value={titleStatus}
                          onChange={e => setTitleStatus(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Drivetrain</label>
                        <input
                          type="text"
                          placeholder="e.g. Rear-Wheel Drive"
                          value={drivetrain}
                          onChange={e => setDrivetrain(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Engine</label>
                        <input
                          type="text"
                          placeholder="e.g. 3.2L Inline-6"
                          value={engine}
                          onChange={e => setEngine(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Seller</label>
                        <input
                          type="text"
                          value={seller}
                          onChange={e => setSeller(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Exterior Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Carbon Black Metallic"
                          value={exteriorColor}
                          onChange={e => setExteriorColor(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Interior Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Gray Nappa Leather"
                          value={interiorColor}
                          onChange={e => setInteriorColor(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Seller Type</label>
                        <select
                          value={sellerType}
                          onChange={e => setSellerType(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        >
                          <option value="Dealer">Dealer</option>
                          <option value="Private Seller">Private Seller</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Ownership History (Paragraph)</label>
                        <textarea
                          rows={3}
                          placeholder="Historical facts about previous owners, import status, etc."
                          value={ownershipHistory}
                          onChange={e => setOwnershipHistory(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Seller Notes (Paragraph)</label>
                        <textarea
                          rows={3}
                          placeholder="Special words from dealer or current servicing highlights."
                          value={sellerNotes}
                          onChange={e => setSellerNotes(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Dynamic Multi-Value Lists */}
                  <div className="space-y-6">
                    <h4 className="text-[12.5px] font-bold text-[#ffffff] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
                      3. Key Bullets Lists
                    </h4>

                    {/* Highlights List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#ffffff]" /> Highlights
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddArrayField(setHighlights)}
                          className="text-[11px] font-bold text-[#ffffff] hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {highlights.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Bullet description"
                            value={val}
                            onChange={e => handleArrayValueChange(idx, e.target.value, setHighlights)}
                            className="flex-1 bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayField(idx, setHighlights, highlights)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Equipment List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                          <Sliders size={13} className="text-blue-400" /> Notable Equipment
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddArrayField(setEquipment)}
                          className="text-[11px] font-bold text-[#ffffff] hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {equipment.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 19-inch split-spoke forged alloy wheels"
                            value={val}
                            onChange={e => handleArrayValueChange(idx, e.target.value, setEquipment)}
                            className="flex-1 bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayField(idx, setEquipment, equipment)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Flaws List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                          <AlertCircle size={13} className="text-amber-400" /> Reported Flaws
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddArrayField(setFlaws)}
                          className="text-[11px] font-bold text-[#ffffff] hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {flaws.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Curb rash on driver rear wheel"
                            value={val}
                            onChange={e => handleArrayValueChange(idx, e.target.value, setFlaws)}
                            className="flex-1 bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayField(idx, setFlaws, flaws)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Service History */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                          <History size={13} className="text-[#ffffff]" /> Service History Log
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddArrayField(setServiceHistory)}
                          className="text-[11px] font-bold text-[#ffffff] hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {serviceHistory.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. New battery installed (July 2024)"
                            value={val}
                            onChange={e => handleArrayValueChange(idx, e.target.value, setServiceHistory)}
                            className="flex-1 bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayField(idx, setServiceHistory, serviceHistory)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Items Included */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                          <FileText size={13} className="text-white" /> Items Included in Sale
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddArrayField(setItemsIncluded)}
                          className="text-[11px] font-bold text-[#ffffff] hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {itemsIncluded.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 2 key fobs, original window sticker"
                            value={val}
                            onChange={e => handleArrayValueChange(idx, e.target.value, setItemsIncluded)}
                            className="flex-1 bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayField(idx, setItemsIncluded, itemsIncluded)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 4: Image & File Uploads */}
                  <div className="space-y-4">
                    <h4 className="text-[12.5px] font-bold text-[#ffffff] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
                      4. Media & Gallery Images
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-bold text-white">Main Image Link / URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. /inventory/mycar.jpg (If left blank, the first uploaded file will be used as the main photo)"
                          value={mainImageUrl}
                          onChange={e => setMainImageUrl(e.target.value)}
                          className="w-full bg-[#181818] border border-[#1e293b] rounded-[5px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>

                    {/* File Upload Selector */}
                    <div className="border-2 border-dashed border-[#1e293b] hover:border-[#38d39f]/50 rounded-[8px] p-6 text-center cursor-pointer transition-all bg-[#111827] relative group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => setSelectedFiles(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} className="text-neutral-500 group-hover:text-[#ffffff] transition-colors" />
                        <p className="text-[12.5px] font-extrabold text-white">
                          {selectedFiles && selectedFiles.length > 0
                            ? `${selectedFiles.length} Gallery Images Selected`
                            : 'Upload Gallery Photos'
                          }
                        </p>
                        <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                          Supports JPG, PNG, WEBP (Select multiple images to feed the details page carousel)
                        </p>
                      </div>
                    </div>

                    {uploadProgress && (
                      <p className="text-xs font-bold text-[#ffffff] animate-pulse flex items-center gap-1.5">
                        <Sliders size={12} className="animate-spin" /> {uploadProgress}
                      </p>
                    )}
                  </div>

                  {/* Submit CTA Block */}
                  <div className="pt-6 border-t border-[#1e293b] flex items-center justify-end gap-3 bg-[#0b0f17] sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setShowPostModal(false)}
                      className="flex h-11 items-center justify-center border border-[#1e293b] bg-[#160b26] hover:bg-[#1e293b] text-white hover:text-white px-6 rounded-[6px] text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-11 items-center justify-center bg-[#0284c7] hover:bg-[#2ec592] text-black px-8 rounded-[6px] text-xs font-extrabold tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Publishing listing...' : 'Publish Listing'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Credits / Financing Applications Tab */
        <div className="flex-1 flex flex-col gap-6">

          {/* Overview stats header */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Total Applications</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">{creditApps.length} Received</h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-[#0284c7]/10 text-[#ffffff] flex items-center justify-center">
                <Coins size={20} />
              </div>
            </div>

            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                  {creditApps.filter(c => c.status === 'pending').length} Pending
                </h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>

            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Approved Loans</p>
                <h3 className="text-2xl font-extrabold text-[#ffffff] mt-1">
                  {creditApps.filter(c => c.status === 'approved').length} Approved
                </h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-[#0284c7]/10 text-[#ffffff] flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[8px] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">Rejected</p>
                <h3 className="text-2xl font-extrabold text-rose-400 mt-1">
                  {creditApps.filter(c => c.status === 'rejected').length} Declined
                </h3>
              </div>
              <div className="w-10 h-10 rounded-[6px] bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <X size={20} />
              </div>
            </div>
          </section>

          {/* Search & Filter Controls */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-y border-[#1e293b]">
            <div className="relative flex-1 max-w-md w-full">
              <input
                type="text"
                placeholder="Search applicant name, email, vehicle, phone..."
                value={creditSearchTerm}
                onChange={(e) => setCreditSearchTerm(e.target.value)}
                className="w-full bg-[#181818] border border-[#334155] rounded-[6px] pl-10 pr-4 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-[#0ea5e9] font-medium"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status:</span>
              <select
                value={creditFilterStatus}
                onChange={(e) => setCreditFilterStatus(e.target.value as any)}
                className="bg-[#181818] border border-[#334155] rounded-[6px] px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </section>

          {/* Applications List Grid */}
          <section className="flex-1">
            {isLoadingCreditApps ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
                <div className="w-8 h-8 rounded-full border-2 border-[#1e293b] border-t-[#38d39f] animate-spin"></div>
                <p className="text-xs font-semibold">Loading financing applications...</p>
              </div>
            ) : filteredCreditApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCreditApps.map(app => (
                  <div key={app.id} className="bg-[#0b0f17] border border-[#1e293b] hover:border-[#38d39f]/40 rounded-[10px] p-5 flex flex-col justify-between gap-4 transition-all">
                    
                    {/* Header / Applicant */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-white text-[16px] tracking-tight">{app.applicant_name}</h4>
                        <p className="text-xs text-white flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-neutral-500" /> {app.email}
                        </p>
                        <p className="text-xs text-white flex items-center gap-1 mt-0.5">
                          <User size={12} className="text-neutral-500" /> {app.phone}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider ${
                        app.status === 'approved' ? 'bg-[#0284c7]/10 text-[#ffffff] border border-[#38d39f]/30' :
                        app.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Requested Vehicle & Loan info */}
                    <div className="bg-[#181818] border border-[#1e293b] rounded-[6px] p-3 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-white font-bold">
                        <span className="text-neutral-500 font-normal">Target Vehicle:</span>
                        <span className="text-[#ffffff] truncate max-w-[170px]">{app.vehicle_name || `${app.year} ${app.make} ${app.model}`}</span>
                      </div>
                      <div className="flex justify-between items-center text-white font-bold">
                        <span className="text-neutral-500 font-normal">Loan Amount:</span>
                        <span className="text-white">${Number(app.loan_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-white font-bold">
                        <span className="text-neutral-500 font-normal">Monthly Salary:</span>
                        <span className="text-white">${Number(app.monthly_salary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-white font-bold">
                        <span className="text-neutral-500 font-normal">Term / Rate:</span>
                        <span className="text-white">{app.repayment_term} mos @ {app.interest_rate}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedCreditApp(app)}
                        className="flex-1 py-2 bg-[#160b26] hover:bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} className="text-[#ffffff]" /> View Document
                      </button>
                      <button
                        onClick={() => deleteCreditApp(app.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-[6px] transition-colors cursor-pointer"
                        title="Delete Application"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-3 bg-[#0b0f17] border border-[#1e293b] rounded-[8px]">
                <Coins size={36} className="mx-auto text-neutral-600 animate-bounce" />
                <h4 className="font-bold text-white">No credit applications found</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When buyers click "Get Financed" on any vehicle page, their complete loan applications will appear right here.
                </p>
              </div>
            )}
          </section>

        </div>
      )}

      {/* Detailed Document Modal for Selected Credit Application */}
      {selectedCreditApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[12px] w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#160b26]">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#ffffff]" />
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Car Loan Application Form Template
                </h2>
              </div>
              <button
                onClick={() => setSelectedCreditApp(null)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Application Document Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Document Header Title */}
              <div className="text-center border-b border-[#1e293b] pb-5">
                <h1 className="text-xl font-extrabold text-white underline tracking-tight">Car Loan Application Form</h1>
                <p className="text-neutral-500 text-[11px] font-semibold mt-1">Submitted on {new Date(selectedCreditApp.created_at).toLocaleString()}</p>
              </div>

              {/* Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181818] border border-[#1e293b] p-3.5 rounded-[8px]">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">Current Status:</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider ${
                    selectedCreditApp.status === 'approved' ? 'bg-[#0284c7]/10 text-[#ffffff] border border-[#38d39f]/30' :
                    selectedCreditApp.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedCreditApp.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCreditStatus(selectedCreditApp.id, 'approved')}
                    className="px-3 py-1.5 bg-[#0284c7]/10 hover:bg-[#0284c7]/20 border border-[#38d39f]/30 text-[#ffffff] font-extrabold text-[11px] rounded transition-colors cursor-pointer"
                  >
                    Approve Loan
                  </button>
                  <button
                    onClick={() => updateCreditStatus(selectedCreditApp.id, 'rejected')}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-extrabold text-[11px] rounded transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateCreditStatus(selectedCreditApp.id, 'pending')}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[11px] rounded transition-colors cursor-pointer"
                  >
                    Set Pending
                  </button>
                </div>
              </div>

              {/* 1. Personal Details */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-white border-b border-[#1e293b] pb-1.5 uppercase tracking-wider">
                  Personal Details
                </h3>
                <ul className="space-y-2 font-medium text-white list-disc pl-5 text-[13px]">
                  <li><strong className="text-white">Name:</strong> {selectedCreditApp.applicant_name}</li>
                  <li><strong className="text-white">Address:</strong> {selectedCreditApp.address}</li>
                  <li><strong className="text-white">Date of Birth:</strong> {selectedCreditApp.dob}</li>
                  <li><strong className="text-white">SSN:</strong> {selectedCreditApp.ssn}</li>
                  <li><strong className="text-white">Email:</strong> {selectedCreditApp.email}</li>
                  <li><strong className="text-white">Phone:</strong> {selectedCreditApp.phone}</li>
                </ul>
              </div>

              {/* 2. Financial Details */}
              <div className="space-y-3 pt-2">
                <h3 className="font-extrabold text-sm text-white border-b border-[#1e293b] pb-1.5 uppercase tracking-wider">
                  Financial Details
                </h3>
                <ul className="space-y-2 font-medium text-white list-disc pl-5 text-[13px]">
                  <li><strong className="text-white">Employer Name:</strong> {selectedCreditApp.employer_name}</li>
                  <li><strong className="text-white">Job Title:</strong> {selectedCreditApp.job_title}</li>
                  <li><strong className="text-white">Monthly Salary:</strong> ${Number(selectedCreditApp.monthly_salary || 0).toLocaleString()}</li>
                  <li><strong className="text-white">Employment Status:</strong> {selectedCreditApp.employment_status}</li>
                  {selectedCreditApp.other_income_source && (
                    <li><strong className="text-white">Other Income Source (if any):</strong> {selectedCreditApp.other_income_source}</li>
                  )}
                </ul>
              </div>

              {/* 3. Loan Request */}
              <div className="space-y-3 pt-2">
                <h3 className="font-extrabold text-sm text-white border-b border-[#1e293b] pb-1.5 uppercase tracking-wider">
                  Loan Request
                </h3>
                <ul className="space-y-2 font-medium text-white list-disc pl-5 text-[13px]">
                  <li><strong className="text-white">Loan Amount:</strong> ${Number(selectedCreditApp.loan_amount || 0).toLocaleString()}</li>
                  <li><strong className="text-white">Loan Purpose:</strong> {selectedCreditApp.loan_purpose}</li>
                  <li><strong className="text-white">Repayment Term:</strong> {selectedCreditApp.repayment_term} months</li>
                  <li><strong className="text-white">Interest Rate:</strong> {selectedCreditApp.interest_rate}%</li>
                </ul>
              </div>

              {/* 4. Vehicle Details */}
              <div className="space-y-3 pt-2">
                <h3 className="font-extrabold text-sm text-white border-b border-[#1e293b] pb-1.5 uppercase tracking-wider">
                  Vehicle Details
                </h3>
                <ul className="space-y-2 font-medium text-white list-disc pl-5 text-[13px]">
                  <li><strong className="text-white">Make:</strong> {selectedCreditApp.make}</li>
                  <li><strong className="text-white">Model:</strong> {selectedCreditApp.model}</li>
                  <li><strong className="text-white">Year:</strong> {selectedCreditApp.year}</li>
                  <li><strong className="text-white">Purchase Price:</strong> ${Number(selectedCreditApp.purchase_price || 0).toLocaleString()}</li>
                  {selectedCreditApp.trade_in_value && (
                    <li><strong className="text-white">Trade-in Value (if applicable):</strong> ${Number(selectedCreditApp.trade_in_value || 0).toLocaleString()}</li>
                  )}
                </ul>
              </div>

              {/* Footer copyright template */}
              <div className="text-right pt-6 text-[10px] text-neutral-600 border-t border-[#1e293b]">
                Copyright @ SampleForms.com
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
