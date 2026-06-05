import requests

url = "http://localhost:8000/etl/upload-csv"
files = {'file': ('test.csv', open('test.csv', 'rb'), 'text/csv')}
data = {'targetCountry': 'PH', 'campaignName': 'JCB Promo'}

# We need to simulate the admin auth header if it's required
# Looking at etl.py, it uses `require_admin` dependency.
# In require_admin middleware, how does it authenticate?
# We'll just pass a standard token if needed, or check the middleware.
headers = {
    'Authorization': 'Bearer admin-token-if-needed'
}

response = requests.post(url, files=files, data=data)
print("Status Code:", response.status_code)
print("Response Body:", response.text)
