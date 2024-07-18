import { compose } from 'ramda'
import React, { FC, useEffect, useState } from 'react'
import { graphql } from 'react-apollo'
import sessionQuery from 'vtex.store-resources/QuerySession'
import processSession from '../utils/processSession'
import { withSession } from 'vtex.render-runtime'
import isMyVtex from '../utils/isMyVtex'
import Telemarketing from './Telemarketing'
import axios from 'axios'
import { OrderForm } from 'vtex.order-manager'

const { useOrderForm } = OrderForm

interface Props {
  /** Query with the session */
  session?: Session
}

const TelemarketingContainer: FC<Props> = ({session}) => {
  const [emailInput, setEmailInput] = useState<string>('')
  const [loadingImpersonate, setloadingImpersonate] = useState<boolean>(false)

  const { orderForm, setOrderForm, loading } = useOrderForm()

  useEffect(() => {
    axios.get('/api/checkout/pub/orderForm', { withCredentials: true })
    .then(res => {
      setOrderForm(res.data)
    })
  }, [])

  const processedSession = processSession(session)

  if (!processedSession?.canImpersonate || loading) {
    return null
  }

  const handleInputChange = (event: any) => {
    setEmailInput(event.target.value)
  }

  const handleDepersonify = () => {
    setloadingImpersonate(true)

    axios.get('/api/checkout/pub/orderForm?forceNewCart=true')
      .then(async res => {
        const { orderFormId } = res?.data

        await axios.get(`/checkout/changeToAnonymousUser/${orderFormId}`)
          .then(() => {
            window.location.reload()
          })
          .catch((err) => {
            console.error('changeToAnonymousUser', err.message)
          })
      })
      .finally(() => {
        setloadingImpersonate(false)
      })
  }

  const handleImpersonate = (email: string) => {
    setloadingImpersonate(true)

    axios.get('/api/checkout/pub/orderForm?forceNewCart=true')
      .then(async res => {
        const { orderFormId } = res?.data

        await axios.post(`/api/checkout/pub/orderForm/${orderFormId}/attachments/clientProfileData`, 
          {
          email
          })
          .then(async () => {
            const profile = await axios.get('/api/checkout/pub/profiles', {
              params: {
                email
              }
            })

            if (profile?.data) {
              const contactInformation = profile.data.contactInformation?.map((contact: any) => {
                return {
                  id: contact.id
                }
              })

              await axios.post(`/api/checkout/pub/orderForm/${orderFormId}/attachments/shippingData`,
                {
                  selectedAddresses: [],
                  contactInformation 
                }
              ).then(() => {
                window.location.reload()
              })
              .catch((err) => {
                console.error('shippingData', err.message)
              })
            }
          })
      })
      .catch((err) => {
        console.error('clientProfileData', err.message)
      })
      .finally(() => {
        setloadingImpersonate(false)
      })
  }

  const { attendantEmail } = processedSession

  let client: Client | undefined = undefined

  if (orderForm?.clientProfileData?.email && attendantEmail !== orderForm.clientProfileData.email) {
    client = {
      document: orderForm.clientProfileData.document,
      phone: orderForm.clientProfileData.phone,
      name: `${orderForm.clientProfileData.firstName} ${orderForm.clientProfileData.lastName}`,
      email: orderForm.clientProfileData.email
    }
  }

  return (
    <Telemarketing
      client={client}
      loading={loadingImpersonate}
      emailInput={emailInput}
      attendantEmail={attendantEmail}
      onImpersonate={handleImpersonate}
      onDepersonify={handleDepersonify}
      onInputChange={handleInputChange}
    />
  )
}

const options = {
  name: 'session',
  skip: () => !isMyVtex(),
  options: () => ({
    ssr: false,
  }),
}

const EnhancedTelemarketing = withSession({ loading: React.Fragment })(
  compose(
    graphql(sessionQuery, options),
  )(TelemarketingContainer as any)
)

export default EnhancedTelemarketing

