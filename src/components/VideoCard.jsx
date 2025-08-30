import {Link} from 'react-router-dom'
import { Card, CardMedia, CardContent, Typography } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import {demoChannelTitle
  ,demoChannelUrl
  ,demoThumbnailUrl
  ,demoVideoUrl
  ,demoVideoTitle} from '../utils/constants'
import { YTDurationToSeconds } from '../utils/timeConverters'


const VideoCard = ({video: {id : { videoId }, snippet}}) => {
  return (
    <Card sx={{ width:{ md: '320px', xs:'%100'}}}>
      <Link to={videoId? `/video/${videoId}` : demoVideoUrl}>
        <CardMedia 
          image={snippet?.thumbnails?.high?.url}
          alt={snippet?.title}
          sx={{width:358, height:180}}
        />      
      </Link>
      <CardContent sx={{backgroundColor: 'gray', height: '106px'}}>
        <Link to={videoId? `/video/${videoId}` : demoVideoUrl}>
          <Typography variant='subtitle1' fontWeight='bold' color='white'>
            {snippet?.title || demoVideoTitle}
          </Typography>
          <Typography variant='subtitle2' fontWeight='bold' color='lightGray'>
            {snippet.duration && ('Sure: ' +  YTDurationToSeconds(snippet.duration)) }
            {snippet.duration && <br/>}
            {'Yukleme: ' + (snippet?.uploadDate?.slice(0,10) || (snippet?.publishedAt?.slice(0,10)))}
          </Typography>
        </Link>
      </CardContent>
    </Card>
  )
}

export default VideoCard