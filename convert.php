<?php
// Set maximum execution time
set_time_limit(300); // 5 minutes max

// Set memory limit
ini_set('memory_limit', '256M');

// Set headers to prevent caching
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json');

// Function to check if ffmpeg is installed
function is_ffmpeg_installed() {
    $ffmpeg_path = '/usr/bin/ffmpeg';
    if (file_exists($ffmpeg_path) && is_executable($ffmpeg_path)) {
        return true;
    }
    
    exec('which ffmpeg 2>&1', $output, $return_val);
    if ($return_val === 0 && !empty($output)) {
        return true;
    }
    
    exec('ffmpeg -version 2>&1', $version_output, $version_return);
    if ($version_return === 0) {
        return true;
    }
    
    return false;
}

// Function to get the output file path for the MP3
function get_mp3_path($flac_path, $bitrate) {
    // Get directory part - in case file is in a subdirectory
    $dir_part = dirname($flac_path);
    $dir_part = ($dir_part == '.') ? '' : $dir_part;
    
    // Extract just the filename without path
    $filename = basename($flac_path);
    
    // Remove the extension
    $filename_no_ext = pathinfo($filename, PATHINFO_FILENAME);
    
    // Construct the path with proper directory structure
    if (!empty($dir_part)) {
        // Replace directory separator with underscore to keep things simple
        $dir_part = str_replace('/', '_', $dir_part);
        $output_filename = "{$dir_part}_{$filename_no_ext}.mp3";
    } else {
        $output_filename = "{$filename_no_ext}.mp3";
    }
    
    // Return the path in the appropriate bitrate directory
    return "music/{$bitrate}/{$output_filename}";
}

// Function to convert FLAC to MP3
function convert_flac_to_mp3($input_file, $output_file, $bitrate) {
    // Path to ffmpeg executable
    $ffmpeg_path = '/usr/bin/ffmpeg';
    
    // Create command based on bitrate
    if ($bitrate == "320") {
        // Use -threads 2 to limit CPU usage and -n for non-interactive mode
        $cmd = "nice -n 10 $ffmpeg_path -threads 2 -i \"music/{$input_file}\" -ab 320k -map_metadata 0 -id3v2_version 3 -y \"{$output_file}\" 2>&1";
    } else {
        $cmd = "nice -n 10 $ffmpeg_path -threads 2 -i \"music/{$input_file}\" -ab 192k -map_metadata 0 -id3v2_version 3 -y \"{$output_file}\" 2>&1";
    }
    
    // Execute the command
    exec($cmd, $output, $return_var);
    
    if ($return_var === 0 && file_exists($output_file)) {
        // Set appropriate permissions on the new file
        exec("chmod --reference=index.html \"{$output_file}\" 2>&1", $chmod_output, $chmod_result);
        exec("chown --reference=index.html \"{$output_file}\" 2>&1", $chown_output, $chown_result);
        
        return true;
    }
    
    return false;
}

// Security check - only allow from our domain
$allowed_origins = ['sewerslvt.ayukiro.xyz', 'localhost', '127.0.0.1'];
$origin = isset($_SERVER['HTTP_REFERER']) ? parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) : '';

// Bypass the check if we're testing directly
if (empty($origin) && (isset($_GET['debug']) || $_SERVER['REMOTE_ADDR'] == '127.0.0.1')) {
    // Local testing allowed
} else if (!in_array($origin, $allowed_origins)) {
    $response = [
        'success' => false,
        'message' => 'Unauthorized access'
    ];
    echo json_encode($response);
    exit;
}

// Check if all required parameters are provided
if (!isset($_GET['file']) || !isset($_GET['bitrate'])) {
    $response = [
        'success' => false,
        'message' => 'Missing parameters'
    ];
    echo json_encode($response);
    exit;
}

// Get the parameters
$file = $_GET['file'];
$bitrate = $_GET['bitrate']; // 320 or 192

// Remove any leading './music/' if it exists
$file = preg_replace('|^\.?/?music/|', '', $file);

// Security check - validate input - Allowing spaces, parentheses, and more chars for music files
$reg_check = preg_match('/^[a-zA-Z0-9\/_\-\.\s\(\)\[\]\,\&\'\!]+\.flac$/i', $file);

if (!$reg_check) {
    $response = [
        'success' => false,
        'message' => 'Invalid file path'
    ];
    echo json_encode($response);
    exit;
}

// Validate bitrate
if ($bitrate !== '320' && $bitrate !== '192') {
    $response = [
        'success' => false,
        'message' => 'Invalid bitrate. Choose 320 or 192.'
    ];
    echo json_encode($response);
    exit;
}

// Check if the input file exists
if (!file_exists("music/{$file}")) {
    $response = [
        'success' => false,
        'message' => 'Source file not found'
    ];
    echo json_encode($response);
    exit;
}

// Check if the file is a FLAC file
if (pathinfo($file, PATHINFO_EXTENSION) !== 'flac') {
    $response = [
        'success' => false,
        'message' => 'The file must be a FLAC file'
    ];
    echo json_encode($response);
    exit;
}

// Check if ffmpeg is installed
if (!is_ffmpeg_installed()) {
    $response = [
        'success' => false,
        'message' => 'FFmpeg is not installed on the server'
    ];
    echo json_encode($response);
    exit;
}

// Get the output file path
$output_file = get_mp3_path($file, $bitrate);

// Check if the file already exists
$file_exists = file_exists($output_file);
$is_readable = is_readable($output_file);

if ($file_exists && $is_readable) {
    $response = [
        'success' => true,
        'message' => 'File already exists',
        'file' => $output_file
    ];
    echo json_encode($response);
    exit;
}

// Make sure output directory exists
$output_dir = dirname($output_file);
if (!is_dir($output_dir)) {
    mkdir($output_dir, 0755, true);
}

// Convert the file
$success = convert_flac_to_mp3($file, $output_file, $bitrate);

if ($success) {
    $response = [
        'success' => true,
        'message' => 'Conversion successful',
        'file' => $output_file
    ];
} else {
    $response = [
        'success' => false,
        'message' => 'Conversion failed'
    ];
}

echo json_encode($response); 