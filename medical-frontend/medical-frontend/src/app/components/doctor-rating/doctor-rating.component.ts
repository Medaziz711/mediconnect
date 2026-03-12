import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-container">
      @if (displayMode === 'display') {
        <div class="rating-display">
          <div class="stars">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <span class="star" [class.filled]="star <= rating" [class.half]="star === Math.ceil(rating) && rating % 1 >= 0.5">
                ★
              </span>
            }
          </div>
          <span class="rating-value">{{ rating.toFixed(1) }}</span>
          @if (totalReviews !== undefined && totalReviews > 0) {
            <span class="review-count">({{ totalReviews }} {{ totalReviews === 1 ? 'review' : 'reviews' }})</span>
          }
        </div>
      } @else {
        <div class="rating-input">
          <label>{{ label }}</label>
          <div class="stars-input">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <button
                type="button"
                class="star-btn"
                [class.active]="star <= currentRating"
                (click)="setRating(star)"
                (mouseenter)="hoverRating = star"
                (mouseleave)="hoverRating = 0"
                [attr.aria-label]="'Rate ' + star + ' stars'"
              >
                ★
              </button>
            }
          </div>
          @if (currentRating > 0) {
            <span class="rating-text">{{ getRatingText(currentRating) }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .rating-container {
      display: flex;
      align-items: center;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stars {
      display: flex;
      gap: 0.125rem;
    }

    .star {
      font-size: 1.25rem;
      color: #ddd;
      transition: color 0.2s;
    }

    .star.filled {
      color: #ffc107;
    }

    .star.half {
      background: linear-gradient(90deg, #ffc107 50%, #ddd 50%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .rating-value {
      font-weight: 600;
      color: #333;
      font-size: 1rem;
    }

    .review-count {
      color: #666;
      font-size: 0.9rem;
    }

    .rating-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .rating-input label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .stars-input {
      display: flex;
      gap: 0.25rem;
    }

    .star-btn {
      background: none;
      border: none;
      font-size: 2rem;
      color: #ddd;
      cursor: pointer;
      transition: all 0.2s;
      padding: 0;
      line-height: 1;
    }

    .star-btn:hover,
    .star-btn.active {
      color: #ffc107;
      transform: scale(1.1);
    }

    .rating-text {
      color: #666;
      font-size: 0.9rem;
      font-style: italic;
    }
  `,
})
export class DoctorRatingComponent {
  @Input() rating: number = 0;
  @Input() totalReviews?: number;
  @Input() displayMode: 'display' | 'input' = 'display';
  @Input() label: string = 'Rating';
  @Output() ratingChange = new EventEmitter<number>();

  currentRating: number = 0;
  hoverRating: number = 0;
  Math = Math;

  setRating(value: number) {
    this.currentRating = value;
    this.ratingChange.emit(value);
  }

  getRatingText(rating: number): string {
    const texts: { [key: number]: string } = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return texts[rating] || '';
  }
}
