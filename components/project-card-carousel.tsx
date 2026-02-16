'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface ProjectCardCarouselProps {
  images: string[];
  title: string;
  className?: string;
}

export function ProjectCardCarousel({ images, title, className }: ProjectCardCarouselProps) {
  const slides = images && images.length > 0 ? images : [];

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-t-lg', className)}>
      <Carousel opts={{ loop: true }}>
        <CarouselContent>
          {slides.map((src, index) => (
            <CarouselItem key={`${src}-${index}`}>
              <img
                src={src}
                alt={`${title} preview ${index + 1}`}
                className="h-36 w-full object-cover"
                loading="lazy"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="h-7 w-7" />
            <CarouselNext className="h-7 w-7" />
          </>
        )}
      </Carousel>
    </div>
  );
}
