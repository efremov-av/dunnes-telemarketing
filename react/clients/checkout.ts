import axios from 'axios'

export const checkoutClient = {
  createNewCart: () => {
    return axios.get('/api/checkout/pub/orderForm?forceNewCart=true')
  },

  changeToAnonymousUser: (orderFormId: string) => {
    return axios.get(`/checkout/changeToAnonymousUser/${orderFormId}`)
  },

  attachClientProfileData: (orderFormId: string, email: string) => {
    return axios.post(
      `/api/checkout/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
      {
        email,
      }
    )
  },

  getProfile: (email: string) => {
    return axios.get('/api/checkout/pub/profiles', {
      params: {
        email
      }
    })
  },

  attachShippingData: (orderFormId: string, contactInformation: any) => {
    return axios.post(`/api/checkout/pub/orderForm/${orderFormId}/attachments/shippingData`,
      {
        selectedAddresses: [],
        contactInformation 
      }
    )
  }
}
