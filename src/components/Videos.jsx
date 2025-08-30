import { Stack, Box} from '@mui/material'
import {VideoCard, ChannelCard} from '../components'


const Videos = ({videos, direction}) => {
  if(!videos?.length) return '...'
  return (
    <Stack 
        direction={direction || 'row'} 
        flexWrap='wrap' 
        justifyContent='center'
        gap={2}
        maxHeight='90vh'
        overflow='auto'>
        
        {videos.map((item, idx) => (
            <Box key={idx} >
                {item.id.videoId && <VideoCard video={item}/> }
            </Box>
        ))}
    </Stack>
  )
}

export default Videos