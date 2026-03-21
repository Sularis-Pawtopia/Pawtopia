'use client';

import { useEffect, useMemo, useState } from 'react';

interface PetIdCardDownloadProps {
  pet: any;
  ownerContext?: any;
}

function buildPetIdCode(rawId: string | undefined) {
  const cleaned = String(rawId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const segment = cleaned.slice(-8).padStart(8, '0');
  return `PT-${segment}`;
}

function safeText(value: unknown, fallback = 'N/A') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });
}

function pickFirst(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function formatDate(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Not provided';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Draws an image on the canvas using "object-fit: cover" logic.
 * Centers the image and crops excess to fill the destination rectangle.
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const targetRatio = w / h;
  const srcRatio = img.width / img.height;

  let srcX = 0;
  let srcY = 0;
  let srcW = img.width;
  let srcH = img.height;

  if (srcRatio > targetRatio) {
    // Image is wider than target: crop width
    srcW = img.height * targetRatio;
    srcX = (img.width - srcW) / 2;
  } else {
    // Image is taller than target: crop height
    srcH = img.width / targetRatio;
    srcY = (img.height - srcH) / 2;
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
}

function drawImageContainCentered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.min(w / img.width, h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number,
  weight: '400' | '600' | '700' = '700'
) {
  let size = maxFontSize;
  while (size >= minFontSize) {
    ctx.font = `${weight} ${size}px Arial`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  ctx.fillText(text, x, y);
}

export function PetIdCardDownload({ pet, ownerContext }: PetIdCardDownloadProps) {
  const [cardDataUrl, setCardDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const petIdCode = useMemo(() => buildPetIdCode(pet?.id), [pet?.id]);
  const imageUrl = useMemo(() => {
    const mediaUrls = pet?.post?.media_urls;
    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      return String(mediaUrls[0]);
    }
    return '';
  }, [pet?.post?.media_urls]);

  const ownerName = useMemo(
    () =>
      safeText(
        pickFirst(
          ownerContext?.full_name,
          ownerContext?.name,
          ownerContext?.username,
          ownerContext?.adopter_profile?.full_name,
          ownerContext?.shelter_profile?.contact_first_name,
          pet?.owner_name,
          pet?.ownerName,
          pet?.owner?.full_name,
          pet?.owner?.name,
          pet?.owner?.username,
          pet?.user?.full_name,
          pet?.user?.name,
          pet?.user?.username,
          pet?.adopter?.full_name,
          pet?.adopter?.name,
          pet?.profile?.full_name,
          pet?.profile?.name
        ),
        'Not provided'
      ),
    [
      pet?.owner_name,
      pet?.ownerName,
      pet?.owner?.full_name,
      pet?.owner?.name,
      pet?.owner?.username,
      pet?.user?.full_name,
      pet?.user?.name,
      pet?.user?.username,
      pet?.adopter?.full_name,
      pet?.adopter?.name,
      pet?.profile?.full_name,
      pet?.profile?.name,
      ownerContext?.full_name,
      ownerContext?.name,
      ownerContext?.username,
      ownerContext?.adopter_profile?.full_name,
      ownerContext?.shelter_profile?.contact_first_name,
    ]
  );

  const ownerContact = useMemo(
    () =>
      safeText(
        pickFirst(
          ownerContext?.phone,
          ownerContext?.contact_number,
          ownerContext?.email,
          ownerContext?.adopter_profile?.contact_number,
          ownerContext?.adopter_profile?.email,
          pet?.owner_contact,
          pet?.ownerContact,
          pet?.owner_phone,
          pet?.ownerPhone,
          pet?.owner?.phone,
          pet?.owner?.contact_number,
          pet?.owner?.email,
          pet?.user?.phone,
          pet?.user?.contact_number,
          pet?.user?.email,
          pet?.phone,
          pet?.contact_number,
          pet?.email
        ),
        'Not provided'
      ),
    [
      pet?.owner_contact,
      pet?.ownerContact,
      pet?.owner_phone,
      pet?.ownerPhone,
      pet?.owner?.phone,
      pet?.owner?.contact_number,
      pet?.owner?.email,
      pet?.user?.phone,
      pet?.user?.contact_number,
      pet?.user?.email,
      pet?.phone,
      pet?.contact_number,
      pet?.email,
      ownerContext?.phone,
      ownerContext?.contact_number,
      ownerContext?.email,
      ownerContext?.adopter_profile?.contact_number,
      ownerContext?.adopter_profile?.email,
    ]
  );

  const ownerAddress = useMemo(
    () =>
      safeText(
        pickFirst(
          ownerContext?.address,
          ownerContext?.adopter_profile?.address,
          ownerContext?.city,
          pet?.owner_address,
          pet?.ownerAddress,
          pet?.owner?.address,
          pet?.user?.address,
          pet?.profile?.address
        ),
        'Not provided'
      ),
    [
      ownerContext?.address,
      ownerContext?.adopter_profile?.address,
      ownerContext?.city,
      pet?.owner_address,
      pet?.ownerAddress,
      pet?.owner?.address,
      pet?.user?.address,
      pet?.profile?.address,
    ]
  );

  const birthDate = useMemo(
    () =>
      formatDate(
        pickFirst(
          pet?.birth_date,
          pet?.date_of_birth,
          pet?.birthDate,
          pet?.dob,
          pet?._registry?.birth_date
        )
      ),
    [pet?.birth_date, pet?.date_of_birth, pet?.birthDate, pet?.dob, pet?._registry?.birth_date]
  );

  const vaccinationDate = useMemo(
    () =>
      formatDate(
        pickFirst(
          pet?.last_vaccination_date,
          pet?.vaccination_date,
          pet?.vaccinated_at,
          pet?.updated_vaccination_at,
          pet?._registry?.last_vaccination_date
        )
      ),
    [
      pet?.last_vaccination_date,
      pet?.vaccination_date,
      pet?.vaccinated_at,
      pet?.updated_vaccination_at,
      pet?._registry?.last_vaccination_date,
    ]
  );

  useEffect(() => {
    let active = true;

    const generateCard = async () => {
      setIsGenerating(true);

      const canvas = document.createElement('canvas');
      // CR80 / ISO ID-1 ratio: 85.60mm x 53.98mm
      // We use a high resolution scale (10px = 1mm approx) -> 856 x 540
      canvas.width = 856;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // 1. Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Header Strip (Pawtopia branding)
      ctx.fillStyle = '#FFF7E6';
      ctx.fillRect(0, 0, canvas.width, 94);
      ctx.fillStyle = '#FF9300';
      ctx.fillRect(0, 0, canvas.width, 7);

      // 3. Logo
      let drewLogo = false;
      try {
        const logo = await loadImage('/pawtopia-logo.png');
        if (active) {
          drawImageCover(ctx, logo, 28, 20, 54, 54);
          drewLogo = true;
        }
      } catch {
        drewLogo = false;
      }

      if (!drewLogo) {
        ctx.fillStyle = '#FF9300';
        ctx.beginPath();
        ctx.arc(56, 50, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 16px Arial';
        ctx.fillText('PT', 46, 55);
      }

      // 4. Header Text
      ctx.fillStyle = '#995C00';
      ctx.font = '700 27px Arial';
      ctx.fillText('PAWTOPIA PET ID CARD', 94, 52);
      ctx.fillStyle = '#CC7700';
      ctx.font = '600 14px Arial';
      ctx.fillText('Responsible Pet Ownership Registry', 94, 74);

      // 5. Image Container (Left)
      const imgX = 35;
      const imgY = 118;
      const imgSize = 206;
      
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 2, imgY - 2, imgSize + 4, imgSize + 4);

      let drewImage = false;
      if (imageUrl) {
        try {
          const image = await loadImage(imageUrl);
          if (active) {
            // Keep the whole photo visible and centered by default.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(imgX, imgY, imgSize, imgSize);
            drawImageContainCentered(ctx, image, imgX, imgY, imgSize, imgSize);
            drewImage = true;
          }
        } catch {
          drewImage = false;
        }
      }

      if (!drewImage) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '700 30px Arial';
        ctx.fillText('PHOTO', imgX + imgSize / 2, imgY + imgSize / 2 + 10);
        ctx.textAlign = 'left';
      }

      // 6. Pet Fields (Right)
      const leftColX = 276;
      const rightColX = 568;
      const colWidth = 178;
      
      const name = safeText(pet?.name, 'Unnamed');
      const breed = safeText(pet?.breed);
      const sex = safeText(pet?.gender).toUpperCase();
      const drawField = (label: string, value: string, x: number, y: number) => {
        ctx.fillStyle = '#475569';
        ctx.font = '600 13px Arial';
        ctx.fillText(label.toUpperCase(), x, y);

        ctx.fillStyle = '#0f172a';
        drawFittedText(ctx, value, x, y + 26, colWidth, 24, 16, '700');
      };

      drawField('Name', name, leftColX, 138);
      drawField('Pet ID', petIdCode, rightColX, 138);
      drawField('Breed', breed, leftColX, 204);
      drawField('Sex', sex, rightColX, 204);
      drawField('Birthdate', birthDate, leftColX, 270);
      drawField('Vaccination Date', vaccinationDate, rightColX, 270);

      // Divider above owner details
      // ctx.strokeStyle = '#e2e8f0';
      // ctx.lineWidth = 1;
      // ctx.beginPath();
      // ctx.moveTo(35, 336);
      // ctx.lineTo(650, 336);
      // ctx.stroke();

      // 7. Owner details below image (clean lines, no boxed card)
      const ownerLabelX = 35;
      const ownerValueX = 118;
      const ownerMaxWidth = 540;
      ctx.fillStyle = '#995C00';
      ctx.font = '700 13px Arial';
      ctx.fillText('OWNER DETAILS', ownerLabelX, 362);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 12px Arial';
      ctx.fillText('NAME', ownerLabelX, 396);
      ctx.fillText('CONTACT', ownerLabelX, 426);
      ctx.fillText('ADDRESS', ownerLabelX, 456);

      ctx.fillStyle = '#0f172a';
      drawFittedText(ctx, ownerName, ownerValueX, 394, ownerMaxWidth, 20, 13, '700');
      drawFittedText(ctx, ownerContact, ownerValueX, 428, ownerMaxWidth, 19, 12, '600');
      drawFittedText(ctx, ownerAddress, ownerValueX, 458, ownerMaxWidth, 19, 12, '600');

      // 8. QR placeholder (requested)
      const qrSize = 140;
      const qrX = canvas.width - qrSize - 120;
      const qrY = 330;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#475569';
      ctx.font = '700 13px Arial';
      ctx.fillText('QR CODE', qrX + 42, qrY + 66);
      ctx.font = '400 10px Arial';
      ctx.fillText('placeholder', qrX + 47, qrY + 78);

      // 9. Footer
      const footerY = 490;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, footerY, canvas.width, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 13px Arial';
      ctx.fillText('Issued by Pawtopia. Verify details through official registry channels.', 28, footerY + 30);

      if (!active) return;

      try {
        setCardDataUrl(canvas.toDataURL('image/png'));
      } catch {
        setCardDataUrl('');
      } finally {
        setIsGenerating(false);
      }
    };

    generateCard();

    return () => {
      active = false;
    };
  }, [
    imageUrl,
    ownerContact,
    ownerAddress,
    ownerName,
    pet?.breed,
    pet?.birth_date,
    pet?.date_of_birth,
    pet?.gender,
    pet?.id,
    pet?.last_vaccination_date,
    pet?.name,
    pet?.vaccination_date,
    petIdCode,
  ]);

  const handleDownload = () => {
    if (!cardDataUrl) return;

    const anchor = document.createElement('a');
    anchor.href = cardDataUrl;
    anchor.download = `${petIdCode}.png`;
    anchor.click();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-semibold text-gray-800">Pet ID: {petIdCode}</p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!cardDataUrl || isGenerating}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Download PNG'}
        </button>
      </div>

      <div
        className="w-full rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
        style={{ aspectRatio: '85.6 / 53.98' }}
      >
        {cardDataUrl ? (
          <img 
            src={cardDataUrl} 
            alt="Generated pet ID card" 
            className="w-full h-full object-contain" 
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <span className="text-xs text-gray-400 animate-pulse">Generating preview...</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Standard CR80 Size (85.6mm x 54mm)
      </p>
    </div>
  );
}
