export type CreativeFormat =
  | 'image'
  | 'video'
  | 'carousel'
  | 'dynamic'
  | 'text'
  | 'unknown'
export const FORMAT_LABELS: Record<CreativeFormat, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  carousel: 'Carrossel',
  dynamic: 'Dinâmico / vários formatos',
  text: 'Texto / Pesquisa',
  unknown: 'Formato não informado',
}
export function classifyMetaCreative(creative: any): CreativeFormat {
  const story = creative?.object_story_spec || {},
    feed = creative?.asset_feed_spec || {},
    formats = Array.isArray(feed.ad_formats) ? feed.ad_formats : []
  if (
    (story.link_data?.child_attachments?.length || 0) > 1 ||
    formats.some((s: string) => /CAROUSEL/i.test(s))
  )
    return 'carousel'
  const hasVideo = !!(
    creative?.video_id ||
    story.video_data?.video_id ||
    feed.videos?.length ||
    formats.some((s: string) => /VIDEO/i.test(s)) ||
    creative?.object_type === 'VIDEO'
  )
  const hasImage = !!(
    feed.images?.length || formats.some((s: string) => /IMAGE/i.test(s))
  )
  if (hasImage && hasVideo) return 'dynamic'
  if (hasVideo) return 'video'
  if (
    hasImage ||
    creative?.image_hash ||
    creative?.image_url ||
    story.photo_data ||
    story.link_data?.picture ||
    creative?.object_type === 'PHOTO'
  )
    return 'image'
  return 'unknown' // A thumbnail is a preview, not evidence that the ad is an image.
}
export function creativeImage(creative: any) {
  const s = creative?.object_story_spec || {},
    f = creative?.asset_feed_spec || {}
  return (
    s.video_data?.image_url ||
    f.videos?.find((v: any) => v.thumbnail_url)?.thumbnail_url ||
    creative?.image_url ||
    s.link_data?.picture ||
    s.link_data?.child_attachments?.find((v: any) => v.picture)?.picture ||
    f.images?.find((v: any) => v.url)?.url ||
    creative?.thumbnail_url ||
    ''
  )
}
export function classifyGoogleCreative(type: string): CreativeFormat {
  if (/SEARCH|TEXT|CALL_AD/.test(type)) return 'text'
  if (/VIDEO/.test(type)) return 'video'
  if (/CAROUSEL/.test(type)) return 'carousel'
  if (type === 'IMAGE_AD') return 'image'
  if (/RESPONSIVE_DISPLAY|MULTI_ASSET|DEMAND_GEN/.test(type)) return 'dynamic'
  return 'unknown'
}
