'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, minLength, string, email } from 'valibot'

// Component Imports
import Logo from '@core/svg/Logo'
import Illustrations from '@components/Illustrations'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const schema = object({
  email: string([minLength(1, 'This field is required'), email('Email is invalid')]),
  password: string([
    minLength(1, 'This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  ])
})

const Login = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errorState, setErrorState] = useState(null)

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const saveTokens = (accessToken, refreshToken) => {
    if (rememberMe) {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      sessionStorage.setItem('accessToken', accessToken)
      sessionStorage.setItem('refreshToken', refreshToken)
    }
  }

  const loadUserProfile = async (accessToken) => {
    try {
      const response = await fetch('https://augustus-dev-2.fluidbyte.app/api/dev/auth/me', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load user profile')
      }

      const userProfile = await response.json()

      console.log(userProfile)

      return userProfile;

    } catch (error) {
      console.error(error)
    }
  }

  const userRefc = async (email, pass, userProfileInfo) => {
    const newContent = `export const users = [
      {
        id: '${userProfileInfo.id}',
        name: '${userProfileInfo.first_name} ${userProfileInfo.last_name}',
        password: '${pass}',
        email: '${email}',
        image: '/images/avatars/1.png'
      }
    ];`

    try {
      const response = await fetch('/api/replaceFileContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      })

      const data = await response.json()
      if (response.ok) {
        console.log(data.message)
      } else {
        console.error('Error:', data.message)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleLogin = async (data) => {
    const requestData = new URLSearchParams({
      username: data.email,
      password: data.password,
      grant_type: '',
      scope: '',
      client_id: '',
      client_secret: ''
    })

    try {
      const response = await fetch('https://augustus-dev-2.fluidbyte.app/api/dev/auth/token', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: requestData
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const result = await response.json()

      saveTokens(result.access_token, result.refresh_token)

      const userProfileInfo = await loadUserProfile(result.access_token)

      await userRefc(data.email, data.password, userProfileInfo);

      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (res && res.ok && res.error === null) {
        // Vars
        const redirectURL = searchParams.get('redirectTo') ?? '/'

        router.push(getLocalizedUrl(redirectURL, locale))
      } else {
        if (res?.error) {
          const error = JSON.parse(res.error)

          setErrorState(error)
        }
      }

    } catch (error) {
      setErrorState('Login failed. Please check your credentials and try again.')
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (accessToken) {
      router.push('/')
    }
  }, [router])

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='!p-12'>
          <div className='flex justify-center items-center gap-3 mbe-6'>
            <Logo className='text-primary' height={28} width={35} />
            <Typography variant='h4' className='font-semibold tracking-[0.15px]'>
              {themeConfig.templateName}
            </Typography>
          </div>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}!👋🏻`}</Typography>
              <Typography className='mbs-1'>Please sign-in to your account and start the adventure</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit(handleLogin)} className='flex flex-col gap-5'>
              {errorState && <Typography color='error'>{errorState}</Typography>}

              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    autoFocus
                    type='email'
                    label='Email'
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorState !== null && setErrorState(null)
                    }}
                    {...((errors.email || errorState !== null) && {
                      error: true,
                      helperText: errors?.email?.message || errorState
                    })}
                  />
                )}
              />
              <Controller
                name='password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Password'
                    id='login-password'
                    type={isPasswordShown ? 'text' : 'password'}
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorState !== null && setErrorState(null)
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                          >
                            <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    {...(errors.password && { error: true, helperText: errors.password.message })}
                  />
                )}
              />
              <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />}
                  label='Remember me'
                />
                <Typography
                  className='text-end'
                  color='primary'
                  component={Link}
                  href='/forgot-password'
                >
                  Forgot password?
                </Typography>
              </div>
              <Button fullWidth variant='contained' type='submit'>
                Log In
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>New on our platform?</Typography>
                <Typography component={Link} href='/register' color='primary'>
                  Create an account
                </Typography>
              </div>
              <Divider className='gap-3'>or</Divider>
              <div className='flex justify-center items-center gap-2'>
                <IconButton className='text-facebook'>
                  <i className='ri-facebook-fill' />
                </IconButton>
                <IconButton className='text-twitter'>
                  <i className='ri-twitter-fill' />
                </IconButton>
                <IconButton className='text-github'>
                  <i className='ri-github-fill' />
                </IconButton>
                <IconButton className='text-googlePlus'>
                  <i className='ri-google-line' />
                </IconButton>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Login
