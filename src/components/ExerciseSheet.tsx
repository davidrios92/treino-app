import { useState } from 'react'
import { ExternalLink, Play, Search } from 'lucide-react'
import type { Exercise } from '../lib/db'
import { Sheet } from './ui'

export default function ExerciseSheet({ exercise: ex, open, onClose }: { exercise: Exercise; open: boolean; onClose: () => void }) {
  const [playing, setPlaying] = useState(false)
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name_en ?? ex.name_pt} how to proper form`)}`

  return (
    <Sheet
      open={open}
      onClose={() => {
        setPlaying(false)
        onClose()
      }}
      title={ex.name_pt}
    >
      <div className="space-y-4">
        {ex.name_en && <p className="-mt-2 text-sm text-mute">{ex.name_en}</p>}

        {ex.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ex.images.map((src, i) => (
              <figure key={src} className="overflow-hidden rounded-2xl bg-panel-2">
                <img src={src} alt={`${ex.name_pt} — posición ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-2 py-1 text-center text-[11px] text-mute">{i === 0 ? 'Inicio' : 'Final'}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {ex.muscle && (
          <div className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">{ex.muscle}</div>
        )}

        {ex.description && <p className="leading-relaxed">{ex.description}</p>}

        {ex.tips.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Cómo hacerlo</h4>
            <ol className="space-y-2">
              {ex.tips.map((t, i) => (
                <li key={i} className={`flex gap-3 text-sm leading-snug ${t.startsWith('Erro comum') ? 'text-warn' : ''}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel-2 text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Video</h4>
          {ex.video_id ? (
            playing ? (
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${ex.video_id}?autoplay=1&playsinline=1&rel=0`}
                  title={ex.video_title ?? ex.name_pt}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <button onClick={() => setPlaying(true)} className="relative block w-full overflow-hidden rounded-2xl">
                <img src={`https://i.ytimg.com/vi/${ex.video_id}/hqdefault.jpg`} alt="" className="aspect-video w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="rounded-full bg-accent p-4 text-accent-ink">
                    <Play size={28} fill="currentColor" />
                  </span>
                </span>
              </button>
            )
          ) : null}
          {ex.video_id && ex.video_title && <p className="mt-1 text-xs text-mute">{ex.video_title}</p>}
          <div className="mt-2 flex gap-2">
            {ex.video_id && (
              <a
                href={`https://www.youtube.com/watch?v=${ex.video_id}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-panel-2 px-3 py-2 text-sm"
              >
                <ExternalLink size={14} /> Abrir en YouTube
              </a>
            )}
            <a
              href={searchUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-panel-2 px-3 py-2 text-sm"
            >
              <Search size={14} /> Buscar otros videos
            </a>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
