'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HomeNav } from '@/components/home-nav'
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <HomeNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                Manage Your Business Like a Pro
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                ProfitBox is a comprehensive inventory and profit management solution designed for growing businesses. Track products, manage inventory, analyze sales, and boost profitability—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                  <Link href="#contact">
                    Schedule Demo
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Image Placeholder */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-linear-to-br from-primary/10 to-accent/10 rounded-lg border border-border flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <BarChart3 className="h-20 sm:h-24 w-20 sm:w-24 mx-auto text-primary/50 mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Powerful Features for Your Business
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage, track, and grow your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <Card className="p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Inventory Management</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Real-time inventory tracking, stock level alerts, and automated reorder management to keep your warehouse organized.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Sales Tracking</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Monitor sales performance, track transactions, and manage orders with a centralized platform.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Profit Analytics</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Advanced analytics and reporting tools to understand your profitability and make data-driven decisions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Inventory Manager
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your entire product catalog and inventory with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Info Column */}
            <div className="flex flex-col justify-center">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Add and manage unlimited products with detailed specifications
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Track stock levels across multiple warehouses
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Automatic low stock alerts and reorder notifications
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Batch pricing and category management
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Generate detailed product analytics reports
                  </span>
                </li>
              </ul>
            </div>

            {/* Image Placeholder */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <Package className="h-20 sm:h-24 w-20 sm:w-24 mx-auto text-primary/50 mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Products Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profit Analyzer Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Profit Analyzer
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time insights into your inventory performance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Graph Placeholder */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-linear-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-20 sm:h-24 w-20 sm:w-24 mx-auto text-primary/50 mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Inventory Level Chart</p>
              </div>
            </div>

            {/* Info Column */}
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-6">Master Your Inventory with Powerful Analytics</h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Monitor inventory levels, identify slow-moving items, and optimize stock distribution across your locations.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Real-Time Updates</h4>
                    <p className="text-sm text-muted-foreground">Instant inventory synchronization across all channels</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Smart Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when stock runs low</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Forecasting</h4>
                    <p className="text-sm text-muted-foreground">Predict future inventory needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Analytics Section */}
      <section id="sales" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Sales Analytics & Reporting
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Understand your sales performance and identify growth opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Info Column */}
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-6">Maximize Your Profits with Smart Analysis</h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Analyze profit margins, identify top-performing products, and make data-driven pricing decisions to boost your bottom line.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Sales Tracking</p>
                </Card>
                <Card className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">+50</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Reports Available</p>
                </Card>
                <Card className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">Real</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Time Data</p>
                </Card>
                <Card className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">100%</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Accurate</p>
                </Card>
              </div>
            </div>

            {/* Graph Placeholder */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-linear-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-20 sm:h-24 w-20 sm:w-24 mx-auto text-primary/50 mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Sales Performance Chart</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the option that best fits your needs and let's transform your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:max-w-3xl mx-auto">
            <Card className="p-6 sm:p-8 border-2 border-primary/50 hover:shadow-lg transition-shadow">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">✨ Custom Features</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Want to customize ProfitBox with more features tailored to your specific business needs? Contact our team to discuss custom feature development and implementation.
              </p>
              <Button className="w-full" asChild>
                <a href="mailto:contact@profitbox.com?subject=Custom Features Inquiry&body=I'm interested in discussing custom features for ProfitBox.">
                  Request Custom Features
                </a>
              </Button>
            </Card>

            <Card className="p-6 sm:p-8 border-2 border-primary hover:shadow-lg transition-shadow">
              <div className="inline-block bg-primary px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-primary-foreground mb-4">
                Most Popular
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">💳 Buy Now</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Ready to invest in your business? Contact us today to purchase ProfitBox and get started on your path to better inventory management and increased profitability.
              </p>
              <Button className="w-full" asChild>
                <a href="mailto:sales@profitbox.com?subject=Purchase Inquiry&body=I'm interested in purchasing ProfitBox for my business.">
                  Get a Quote
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-12 sm:mb-16">
              Have questions about ProfitBox? Our team is here to help you implement the perfect solution for your business.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
              <Card className="p-6 sm:p-8">
                <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  contact@profitbox.com
                </p>
                <Button variant="outline" className="w-full text-sm" asChild>
                  <a href="mailto:contact@profitbox.com">Send Email</a>
                </Button>
              </Card>

              <Card className="p-6 sm:p-8">
                <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Phone</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  +1 (555) 123-4567
                </p>
                <Button variant="outline" className="w-full text-sm" asChild>
                  <a href="tel:+15551234567">Call Us</a>
                </Button>
              </Card>
            </div>

            <Card className="p-6 sm:p-8 bg-accent/50">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">Ready to Transform Your Business?</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Contact our team today to schedule a demo and discuss how ProfitBox can help you manage inventory, track sales, and maximize profits.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button asChild>
                  <a href="mailto:contact@profitbox.com">
                    Contact Us
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/sign-up">Start Free Trial</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-accent/30 py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-4">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#products" className="hover:text-foreground transition-colors">Inventory</a></li>
                <li><a href="#sales" className="hover:text-foreground transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-4">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-4">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-4">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Docs</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2026 ProfitBox. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Built with ❤️ for growing businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
