import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { 
  Star, 
  BarChart3, 
  Shield, 
  Zap, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ReviewFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl inline-block mb-6">
              <Star className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Smart Review
              <br />
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl mx-auto">
              Automatically redirect happy customers to Google Reviews while capturing 
              private feedback from others. Boost your online reputation intelligently.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-glow h-14 px-8">
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 h-14 px-8">
              <Link to="/login">
                Business Login
              </Link>
            </Button>
          </div>

          <p className="text-white/60 text-sm">
            ✨ No credit card required • Set up in 2 minutes
          </p>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-elegant">
              <CardContent className="p-6 text-center">
                <div className="bg-accent/20 p-3 rounded-full inline-block mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Routing</h3>
                <p className="text-white/70 text-sm">
                  Automatically redirect 4+ star reviews to Google while collecting improvement feedback privately.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-elegant">
              <CardContent className="p-6 text-center">
                <div className="bg-success/20 p-3 rounded-full inline-block mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Analytics Dashboard</h3>
                <p className="text-white/70 text-sm">
                  Track review trends, rating distribution, and customer sentiment with beautiful analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-elegant">
              <CardContent className="p-6 text-center">
                <div className="bg-warning/20 p-3 rounded-full inline-block mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Reputation Protection</h3>
                <p className="text-white/70 text-sm">
                  Keep negative feedback private while promoting positive experiences publicly on Google.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How ReviewFlow Works</h2>
            <p className="text-white/70 text-lg">Simple, smart, and effective review management in 3 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/20 p-4 rounded-full inline-block mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Customer Reviews</h3>
              <p className="text-white/70">
                Customers rate their experience using our beautiful star rating interface.
              </p>
              <div className="mt-4 flex justify-center">
                <StarRating rating={4} readonly size="sm" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-accent/20 p-4 rounded-full inline-block mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Routing</h3>
              <p className="text-white/70">
                High ratings go to Google Reviews. Lower ratings are captured privately for improvement.
              </p>
              <div className="mt-4">
                <TrendingUp className="w-6 h-6 text-accent mx-auto" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-success/20 p-4 rounded-full inline-block mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Grow & Improve</h3>
              <p className="text-white/70">
                Boost your Google rating while using private feedback to enhance your service.
              </p>
              <div className="mt-4">
                <CheckCircle className="w-6 h-6 text-success mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Review Interface */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Beautiful Review Experience</h2>
          <p className="text-white/70 mb-12">Your customers will love sharing feedback through our intuitive interface</p>
          
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-elegant">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">How was your experience?</h3>
                <div className="flex justify-center mb-6">
                  <StarRating rating={5} readonly size="lg" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Clean, modern interface that your customers will enjoy using
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Reviews?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join hundreds of businesses already using ReviewFlow to boost their online reputation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-glow h-14 px-8">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 h-14 px-8">
              <Link to="/login">
                <MessageSquare className="w-5 h-5 mr-2" />
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">ReviewFlow</span>
          </div>
          <p className="text-white/60 text-sm">
            Smart review management for modern businesses
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;