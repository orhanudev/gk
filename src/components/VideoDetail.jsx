import {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import ReactPlayer from 'react-player'
import {Stack, Box, Typography} from '@mui/material'
import { Helmet } from 'react-helmet';
import {fetchFromApi} from '../utils/fetchFromApi'


const VideoDetail = () => {
  const {id} = useParams()

  useEffect(() => {
    if(window.location.href.includes('kalbe')) {
      document.title = "Gözden Kalbe"
    } else {
      document.title = "İzle Eğlen"
    }
  }, [id])

  return (
    <>
      <Box marginTop='30px' minHeight='95vh'>
        <Stack direction={{xs:'column', md:'row'}}>
          <Box flex={1}>
            <Box sx={{width: '100%', position: 'sticky', top:'86px'}}>
              <ReactPlayer url={`https://www.youtube.com/watch?v=${id}`}
                className='react-player'
                controls={true}
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1, // Minimizes YouTube branding
                      rel: 0,           // Limits related videos to the same channel
                      showinfo: 0,      // (Deprecated, try it) Hides video information
                      iv_load_policy: 3, // Hides video annotations
                    },
                  },
                }}
              />
              <Stack
                direction='row'
                justifyContent='space-between'
                sx= {{
                  color:'white'
                }}
                px={2}
                py={1}
              >
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Box>
    </>
  )
}

export default VideoDetail