import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { ValidatorPage } from '@/pages/ValidatorPage'
import { SampleGeneratorPage } from '@/pages/SampleGeneratorPage'
import { DocumentationPage } from '@/pages/DocumentationPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/validator" element={<ValidatorPage />} />
        <Route path="/samples" element={<SampleGeneratorPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Layout>
  )
}

export default App