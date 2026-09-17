import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Activity, ArrowRight, ChevronDown } from 'lucide-react'

export default function CalculatorsDropdown({ isScrolled = false, mobile = false, onClose = () => {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 180)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const dropdownVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.15 } }
  }

  // Render mobile drawer accordion view
  if (mobile) {
    return (
      <div className="flex flex-col gap-2 py-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
          Calculators
        </div>
        <Link
          to="/calculators/emi"
          onClick={onClose}
          className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 hover:bg-brand-50/60 hover:border-brand-200 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-600 mt-0.5">
            <Calculator size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              Personal Loan EMI Calculator <ArrowRight size={13} className="text-slate-400" />
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Get EMI amount, repayment tenure and interest rate beforehand
            </p>
          </div>
        </Link>

        <Link
          to="/calculators/eligibility"
          onClick={onClose}
          className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 hover:bg-emerald-50/60 hover:border-emerald-200 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
            <Activity size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              Eligibility Calculator <ArrowRight size={13} className="text-slate-400" />
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Easy-to-use calculator to know your loan eligibility in seconds
            </p>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer py-2 ${
          isOpen ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>Calculators</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className="absolute left-0 top-full pt-2 z-50 w-[380px]"
          >
            {/* Popover container styled with FinConnect App White/Slate/Brand theme */}
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-3.5 shadow-[0_12px_36px_-6px_rgba(11,18,32,0.12),0_4px_12px_rgba(11,18,32,0.04)]">
              <div className="flex flex-col gap-2.5">
                {/* 1. Personal Loan EMI Calculator Card */}
                <Link
                  to="/calculators/emi"
                  onClick={() => setIsOpen(false)}
                  className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-brand-200/80 hover:bg-brand-50/50 hover:shadow-[0_4px_16px_rgba(15,118,110,0.06)] transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100/80 flex items-center justify-center shrink-0 text-brand-600 group-hover:scale-105 group-hover:bg-brand-100/70 transition-all duration-200">
                    <Calculator size={20} className="stroke-[1.8]" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-slate-900 text-[14px] leading-tight tracking-[-0.01em] group-hover:text-brand-700 transition-colors">
                        Personal Loan EMI Calculator
                      </h4>
                      <ArrowRight
                        size={15}
                        className="text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-normal font-normal">
                      Get EMI amount, repayment tenure and interest rate beforehand
                    </p>
                  </div>
                </Link>

                {/* 2. Eligibility Calculator Card */}
                <Link
                  to="/calculators/eligibility"
                  onClick={() => setIsOpen(false)}
                  className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200/80 hover:bg-emerald-50/50 hover:shadow-[0_4px_16px_rgba(12,153,86,0.06)] transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all duration-200">
                    <Activity size={20} className="stroke-[1.8]" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-slate-900 text-[14px] leading-tight tracking-[-0.01em] group-hover:text-emerald-700 transition-colors">
                        Eligibility Calculator
                      </h4>
                      <ArrowRight
                        size={15}
                        className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-normal font-normal">
                      Easy-to-use calculator to know your loan eligibility in seconds
                    </p>
                  </div>
                </Link>
              </div>

              {/* Footer badge
              <div className="mt-2.5 pt-2 border-t border-slate-100 px-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Free to use · No login required</span>
                <span className="text-brand-600 font-medium hover:underline">Explore all</span>
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
