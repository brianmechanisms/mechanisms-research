#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../../../../packages/brianmechanisms/src'))

import matplotlib.pyplot as plt
import matplotlib.animation as animation
from brianmechanisms.reciprocating.linearmotion.walking._45 import mechanism45, Settings

def create_showcase_assets():
    # Create settings for clean showcase
    settings = Settings(r1=3.0, r2=0.8, n=3, clean_animation=True, show_labels=False)
    mech = mechanism45(settings)
    
    # 1. Create static PNG
    fig, ax = plt.subplots(figsize=(8, 8))
    
    # Use a good angle to show the mechanism
    test_angle = 135
    gear_state = mech.calculate_gear_state(test_angle)
    
    # Draw big circle
    circle = plt.Circle((0, 0), settings.r1, fill=False, color='black', linewidth=1, linestyle='--')
    ax.add_patch(circle)
    
    # Draw gear with arm
    mech.draw_gear_complete(ax, gear_state['O_x'], gear_state['O_y'], 
                           gear_state['O_triple_x'], gear_state['O_triple_y'],
                           arm_angle_deg=test_angle)
    
    ax.set_xlim(-8, 8)
    ax.set_ylim(-8, 8)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title('Mechanism 45', fontsize=14, pad=20)
    
    plt.savefig('mechanism45.png', dpi=300, bbox_inches='tight', facecolor='white')
    print("Created mechanism45.png")
    plt.close()
    
    # 2. Create animated GIF
    fig, ax = plt.subplots(figsize=(8, 8))
    
    def animate(frame):
        ax.clear()
        
        # Calculate current arm angle
        total_frames = 400
        first_rolling_start_angle = mech.section_angles[1]
        current_arm_angle = first_rolling_start_angle + (frame / total_frames) * 360
        
        # Get gear state
        gear_state = mech.calculate_gear_state(current_arm_angle)
        
        # Draw big circle (dotted)
        circle = plt.Circle((0, 0), settings.r1, fill=False, color='black', linewidth=1, linestyle='--')
        ax.add_patch(circle)
        
        # Draw gear with arm
        mech.draw_gear_complete(ax, gear_state['O_x'], gear_state['O_y'],
                               gear_state['O_triple_x'], gear_state['O_triple_y'],
                               show_labels=False,
                               arm_angle_deg=current_arm_angle)
        
        ax.set_xlim(-8, 8)
        ax.set_ylim(-8, 8)
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_title('Mechanism 45', fontsize=14, pad=20)
    
    ani = animation.FuncAnimation(fig, animate, frames=400, interval=25, repeat=True)
    ani.save('mechanism45.gif', writer='pillow', fps=20, facecolor='white')
    print("Created mechanism45.gif")
    plt.close()
    
    print("Showcase assets created successfully!")

if __name__ == "__main__":
    create_showcase_assets()