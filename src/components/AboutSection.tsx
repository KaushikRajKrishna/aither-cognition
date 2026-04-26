import { motion } from "framer-motion";
import { Heart, Shield, Users, Brain } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold gradient-text mb-6">
            About Aither Cognition
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive mental health support platform designed to provide accessible,
            AI-powered assistance for emotional wellbeing and mental health management.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-2xl font-bold text-foreground mb-6">
              Our Mission
            </h3>
            <p className="text-muted-foreground mb-4">
              Aither Cognition is built to bridge the gap between traditional mental health
              services and accessible digital support. We believe that everyone deserves
              compassionate, intelligent assistance when they need it most.
            </p>
            <p className="text-muted-foreground mb-4">
              Our platform combines advanced AI technology with evidence-based mental health
              practices to create a safe, supportive environment for users to explore their
              emotions, track their mental wellbeing, and connect with professional help when needed.
            </p>
            <p className="text-muted-foreground">
              Whether you're dealing with daily stress, seeking to understand your emotions better,
              or need guidance through challenging times, Aither Cognition is here to support your
              mental health journey.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h4 className="font-display font-bold text-foreground mb-2">Compassionate</h4>
              <p className="text-sm text-muted-foreground">
                Built with empathy and understanding for every user's unique journey
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h4 className="font-display font-bold text-foreground mb-2">Safe & Secure</h4>
              <p className="text-sm text-muted-foreground">
                Your privacy and wellbeing are our top priorities
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h4 className="font-display font-bold text-foreground mb-2">AI-Powered</h4>
              <p className="text-sm text-muted-foreground">
                Advanced AI technology provides personalized support
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h4 className="font-display font-bold text-foreground mb-2">Community</h4>
              <p className="text-sm text-muted-foreground">
                Connect with professionals and build supportive networks
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-6">
            What Makes Us Different
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h4 className="font-display font-bold text-foreground mb-3">24/7 Availability</h4>
              <p className="text-muted-foreground text-sm">
                Support when you need it most, available around the clock to provide
                guidance and assistance whenever you're ready to talk.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h4 className="font-display font-bold text-foreground mb-3">Personalized Approach</h4>
              <p className="text-muted-foreground text-sm">
                Our AI adapts to your unique needs, learning from your conversations
                to provide more relevant and helpful support over time.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h4 className="font-display font-bold text-foreground mb-3">Professional Integration</h4>
              <p className="text-muted-foreground text-sm">
                Seamlessly connect with licensed mental health professionals when
                you need more specialized care or support.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}