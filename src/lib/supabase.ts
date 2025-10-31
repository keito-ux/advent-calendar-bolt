import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)
console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)


// ✅ 画像アップロード
export async function uploadImage(file: File) {
  const filePath = `uploads/${Date.now()}-${file.name}`

  const { error } = await supabase.storage
    .from('advent.pics')
    .upload(filePath, file)

  if (error) {
    console.error('❌ Upload error:', error)
    alert('アップロード失敗: ' + error.message)
    return null
  }

  // 🚀 絶対URL保証つき
  const { data } = supabase.storage.from('advent.pics').getPublicUrl(filePath)
  const baseUrl = import.meta.env.VITE_SUPABASE_URL

  const imageUrl = data.publicUrl?.startsWith('http')
    ? data.publicUrl
    : `${baseUrl}/storage/v1/object/public/advent.pics/${filePath}`

  console.log('✅ 公開URL:', imageUrl)
  return imageUrl
}

export async function saveScene(
  dayNumber: number,
  imageUrl: string,
  title: string,
  artistId: string | null
) {
  const { error } = await supabase
    .from('advent_calendar')
    .insert({
      day_number: dayNumber,
      image_url: imageUrl,
      title: title,
      is_unlocked: false
    })

  if (error) {
    console.error('❌ Save scene error:', error)
    alert('シーン保存失敗: ' + error.message)
    return false
  }

  console.log('✅ Scene saved successfully')
  return true
}
